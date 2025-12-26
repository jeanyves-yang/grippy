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

// Command Tags (TLV format)
export enum CommandTag {
  TARE_SCALE = 0x64,                      // 100 - Tare the scale
  START_WEIGHT_MEASUREMENT = 0x65,        // 101 - Start weight streaming
  STOP_WEIGHT_MEASUREMENT = 0x66,         // 102 - Stop weight streaming
  START_PEAK_RFD_MEASUREMENT = 0x67,      // 103 - Start peak RFD measurement
  START_PEAK_RFD_MEASUREMENT_SERIES = 0x68, // 104 - Start peak RFD series
  ADD_CALIBRATION_POINT = 0x69,           // 105 - Add calibration point
  SAVE_CALIBRATION = 0x6A,                // 106 - Save calibration
  GET_APP_VERSION = 0x6B,                 // 107 - Get firmware version
  GET_ERROR_INFO = 0x6C,                  // 108 - Get error information
  GET_BATTERY_VOLTAGE = 0x6D,             // 109 - Get battery voltage
  SLEEP = 0x6E,                           // 110 - Put device to sleep
}

// Response Tags (TLV format)
export enum ResponseTag {
  WEIGHT_MEASUREMENT = 0xC8,              // 200 - Weight measurement data
  RFD_PEAK = 0xC9,                        // 201 - RFD peak data
  RFD_PEAK_SERIES = 0xCA,                 // 202 - RFD peak series data
  APP_VERSION = 0xCB,                     // 203 - Firmware version
  ERROR_INFO = 0xCC,                      // 204 - Error information
  BATTERY_VOLTAGE = 0xCD,                 // 205 - Battery voltage
  LOW_BATTERY_WARNING = 0xCE,             // 206 - Low battery warning
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
 * @returns Encoded command
 */
export function encodeCommand(tag: CommandTag, data: Uint8Array = new Uint8Array(0)): Uint8Array {
  const length = data.length;
  const buffer = new Uint8Array(2 + length);
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
 * Parse weight measurement response
 * @param data - Response data (4 bytes for float)
 * @returns Weight measurement with timestamp
 */
export function parseWeightMeasurement(data: Uint8Array): WeightMeasurement {
  if (data.length !== 4) {
    throw new Error('Invalid weight measurement data length');
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  // Little-endian float32
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

  return {
    major: data[0],
    minor: data[1],
    patch: data[2],
    version: `${data[0]}.${data[1]}.${data[2]}`,
  };
}
