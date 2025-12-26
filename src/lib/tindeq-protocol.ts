/**
 * Tindeq Progressor Bluetooth Protocol Constants and Utilities
 * Based on official API: https://tindeq.com/progressor_api/
 */

// Bluetooth Service and Characteristic UUIDs
export const PROGRESSOR_SERVICE_UUID = '7e4e1701-1ea6-40c9-9dcc-13d34ffead57';
export const DATA_CHARACTERISTIC_UUID = '7e4e1702-1ea6-40c9-9dcc-13d34ffead57';
export const CONTROL_CHARACTERISTIC_UUID = '7e4e1703-1ea6-40c9-9dcc-13d34ffead57';

// Device name filter for scanning
export const DEVICE_NAME_PREFIX = 'Progressor';

// Command Tags (TLV format) - Based on actual Progressor API
export enum CommandTag {
  TARE_SCALE = 100,                       // 100 - Tare the scale
  START_WEIGHT_MEASUREMENT = 101,         // 101 - Start weight streaming
  STOP_WEIGHT_MEASUREMENT = 102,          // 102 - Stop weight streaming
  START_PEAK_RFD_MEASUREMENT = 103,       // 103 - Start peak RFD measurement
  START_PEAK_RFD_MEASUREMENT_SERIES = 104, // 104 - Start peak RFD series
  ADD_CALIBRATION_POINT = 105,            // 105 - Add calibration point
  SAVE_CALIBRATION = 106,                 // 106 - Save calibration
  GET_APP_VERSION = 107,                  // 107 - Get firmware version
  GET_ERROR_INFO = 108,                   // 108 - Get error information
  CLR_ERROR_INFO = 109,                   // 109 - Clear error information
  ENTER_SLEEP = 110,                      // 110 - Put device to sleep
  GET_BATTERY_VOLTAGE = 111,              // 111 - Get battery voltage
}

// Response Tags (TLV format) - Based on actual Progressor API
export enum ResponseTag {
  CMD_RESPONSE = 0,                       // 0 - Command response
  WEIGHT_MEASUREMENT = 1,                 // 1 - Weight measurement data
  RFD_PEAK = 2,                           // 2 - RFD peak data
  RFD_PEAK_SERIES = 3,                    // 3 - RFD peak series data
  LOW_BATTERY_WARNING = 4,                // 4 - Low battery warning
}

export interface TLVResponse {
  tag: number;
  length: number;
  data: Uint8Array;
}

export interface WeightMeasurement {
  weight: number;  // in kg
  timestamp: number; // milliseconds since epoch
}

export interface BatteryInfo {
  voltage: number; // in millivolts
  percentage?: number; // estimated percentage
}

export interface FirmwareVersion {
  major: number;
  minor: number;
  patch: number;
  version: string;
}

/**
 * Encode command in TLV (Tag-Length-Value) format
 * @param tag - Command tag
 * @param data - Optional command data
 * @returns Encoded command as BufferSource
 */
export function encodeCommand(tag: CommandTag, data: Uint8Array = new Uint8Array(0)): BufferSource {
  const length = data.length;
  const buffer = new Uint8Array(new ArrayBuffer(2 + length));
  buffer[0] = tag;
  buffer[1] = length;
  if (length > 0) {
    buffer.set(data, 2);
  }
  return buffer;
}

/**
 * Decode TLV response
 * @param dataView - Response data
 * @returns Decoded response
 */
export function decodeResponse(dataView: DataView): TLVResponse {
  if (dataView.byteLength < 2) {
    throw new Error('Response too short');
  }

  const tag = dataView.getUint8(0);
  const length = dataView.getUint8(1);

  if (dataView.byteLength < 2 + length) {
    throw new Error('Response data incomplete');
  }

  const data = new Uint8Array(dataView.buffer, dataView.byteOffset + 2, length);

  return { tag, length, data };
}

/**
 * Parse weight measurement response (batched data)
 * Format: [weight(float32), timestamp(uint32), weight(float32), timestamp(uint32), ...]
 * @param data - Response data (8 bytes per measurement: 4 for weight, 4 for timestamp)
 * @returns Array of weight measurements
 */
export function parseWeightMeasurements(data: Uint8Array): WeightMeasurement[] {
  if (data.length % 8 !== 0) {
    throw new Error(`Invalid weight measurement data length: ${data.length} (must be multiple of 8)`);
  }

  const measurements: WeightMeasurement[] = [];
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  for (let i = 0; i < data.length; i += 8) {
    // Little-endian float32 for weight
    const weight = view.getFloat32(i, true);
    // Little-endian uint32 for timestamp (milliseconds)
    const timestamp = view.getUint32(i + 4, true);

    measurements.push({ weight, timestamp });
  }

  return measurements;
}

/**
 * Parse single weight measurement (legacy, for tests)
 * @param data - Response data (4 bytes for float)
 * @returns Weight measurement with current timestamp
 */
export function parseWeightMeasurement(data: Uint8Array): WeightMeasurement {
  if (data.length !== 4) {
    throw new Error('Invalid weight measurement data length');
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const weight = view.getFloat32(0, true);

  return {
    weight,
    timestamp: Date.now(),
  };
}

/**
 * Parse battery voltage response
 * @param data - Response data (2 bytes for uint16)
 * @returns Battery information
 */
export function parseBatteryVoltage(data: Uint8Array): BatteryInfo {
  if (data.length !== 2) {
    throw new Error('Invalid battery voltage data length');
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  // Little-endian uint16
  const voltage = view.getUint16(0, true);

  // Estimate percentage based on typical Li-ion voltage range (3.0V - 4.2V)
  const minVoltage = 3000; // 3.0V in mV
  const maxVoltage = 4200; // 4.2V in mV
  const percentage = Math.max(0, Math.min(100,
    ((voltage - minVoltage) / (maxVoltage - minVoltage)) * 100
  ));

  return {
    voltage,
    percentage: Math.round(percentage),
  };
}

/**
 * Parse firmware version response
 * @param data - Response data (3 bytes: major, minor, patch)
 * @returns Firmware version information
 */
export function parseFirmwareVersion(data: Uint8Array): FirmwareVersion {
  if (data.length !== 3) {
    throw new Error('Invalid firmware version data length');
  }

  const major = data[0]!;
  const minor = data[1]!;
  const patch = data[2]!;

  return {
    major,
    minor,
    patch,
    version: `${major}.${minor}.${patch}`,
  };
}
