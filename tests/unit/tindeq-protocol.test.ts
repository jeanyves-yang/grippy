import { describe, it, expect } from 'vitest';
import {
  CommandTag,
  ResponseTag,
  encodeCommand,
  decodeResponse,
  parseWeightMeasurement,
  parseBatteryVoltage,
  parseFirmwareVersion,
} from '../../src/lib/tindeq-protocol';

describe('tindeq-protocol', () => {
  describe('encodeCommand', () => {
    it('should encode command without data', () => {
      const command = encodeCommand(CommandTag.TARE_SCALE);

      expect(command).toBeInstanceOf(Uint8Array);
      expect(command.length).toBe(2);
      expect(command[0]).toBe(CommandTag.TARE_SCALE);
      expect(command[1]).toBe(0); // length = 0
    });

    it('should encode command with data', () => {
      const data = new Uint8Array([0x01, 0x02, 0x03]);
      const command = encodeCommand(CommandTag.ADD_CALIBRATION_POINT, data);

      expect(command.length).toBe(5); // tag + length + 3 data bytes
      expect(command[0]).toBe(CommandTag.ADD_CALIBRATION_POINT);
      expect(command[1]).toBe(3); // length = 3
      expect(command[2]).toBe(0x01);
      expect(command[3]).toBe(0x02);
      expect(command[4]).toBe(0x03);
    });

    it('should encode start weight measurement command', () => {
      const command = encodeCommand(CommandTag.START_WEIGHT_MEASUREMENT);

      expect(command[0]).toBe(0x65); // 101
      expect(command[1]).toBe(0);
    });

    it('should encode stop weight measurement command', () => {
      const command = encodeCommand(CommandTag.STOP_WEIGHT_MEASUREMENT);

      expect(command[0]).toBe(0x66); // 102
      expect(command[1]).toBe(0);
    });
  });

  describe('decodeResponse', () => {
    it('should decode TLV response', () => {
      const buffer = new Uint8Array([ResponseTag.BATTERY_VOLTAGE, 2, 0x10, 0x0E]);
      const dataView = new DataView(buffer.buffer);

      const response = decodeResponse(dataView);

      expect(response.tag).toBe(ResponseTag.BATTERY_VOLTAGE);
      expect(response.length).toBe(2);
      expect(response.data).toBeInstanceOf(Uint8Array);
      expect(response.data.length).toBe(2);
    });

    it('should throw error for response too short', () => {
      const buffer = new Uint8Array([0x01]); // Only 1 byte
      const dataView = new DataView(buffer.buffer);

      expect(() => decodeResponse(dataView)).toThrow('Response too short');
    });

    it('should throw error for incomplete response data', () => {
      const buffer = new Uint8Array([0x01, 5, 0x10]); // Says length=5 but only 1 data byte
      const dataView = new DataView(buffer.buffer);

      expect(() => decodeResponse(dataView)).toThrow('Response data incomplete');
    });
  });

  describe('parseWeightMeasurement', () => {
    it('should parse weight measurement in kg', () => {
      // 50.5 kg as little-endian float32
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setFloat32(0, 50.5, true); // little-endian
      const data = new Uint8Array(buffer);

      const measurement = parseWeightMeasurement(data);

      expect(measurement.weight).toBeCloseTo(50.5, 2);
      expect(measurement.timestamp).toBeLessThanOrEqual(Date.now());
      expect(measurement.timestamp).toBeGreaterThan(Date.now() - 1000);
    });

    it('should parse zero weight', () => {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setFloat32(0, 0.0, true);
      const data = new Uint8Array(buffer);

      const measurement = parseWeightMeasurement(data);

      expect(measurement.weight).toBe(0);
    });

    it('should parse negative weight', () => {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setFloat32(0, -5.25, true);
      const data = new Uint8Array(buffer);

      const measurement = parseWeightMeasurement(data);

      expect(measurement.weight).toBeCloseTo(-5.25, 2);
    });

    it('should throw error for invalid data length', () => {
      const data = new Uint8Array([0x01, 0x02]); // Only 2 bytes

      expect(() => parseWeightMeasurement(data)).toThrow('Invalid weight measurement data length');
    });
  });

  describe('parseBatteryVoltage', () => {
    it('should parse battery voltage in millivolts', () => {
      // 3850 mV as little-endian uint16
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer);
      view.setUint16(0, 3850, true);
      const data = new Uint8Array(buffer);

      const battery = parseBatteryVoltage(data);

      expect(battery.voltage).toBe(3850);
      expect(battery.percentage).toBeDefined();
      expect(battery.percentage).toBeGreaterThanOrEqual(0);
      expect(battery.percentage).toBeLessThanOrEqual(100);
    });

    it('should calculate percentage for full battery (4200mV)', () => {
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer);
      view.setUint16(0, 4200, true);
      const data = new Uint8Array(buffer);

      const battery = parseBatteryVoltage(data);

      expect(battery.voltage).toBe(4200);
      expect(battery.percentage).toBe(100);
    });

    it('should calculate percentage for empty battery (3000mV)', () => {
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer);
      view.setUint16(0, 3000, true);
      const data = new Uint8Array(buffer);

      const battery = parseBatteryVoltage(data);

      expect(battery.voltage).toBe(3000);
      expect(battery.percentage).toBe(0);
    });

    it('should calculate percentage for mid battery (3600mV)', () => {
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer);
      view.setUint16(0, 3600, true);
      const data = new Uint8Array(buffer);

      const battery = parseBatteryVoltage(data);

      expect(battery.voltage).toBe(3600);
      expect(battery.percentage).toBe(50); // 50% between 3000-4200
    });

    it('should handle voltage below minimum', () => {
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer);
      view.setUint16(0, 2800, true);
      const data = new Uint8Array(buffer);

      const battery = parseBatteryVoltage(data);

      expect(battery.voltage).toBe(2800);
      expect(battery.percentage).toBe(0); // Capped at 0%
    });

    it('should handle voltage above maximum', () => {
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer);
      view.setUint16(0, 4500, true);
      const data = new Uint8Array(buffer);

      const battery = parseBatteryVoltage(data);

      expect(battery.voltage).toBe(4500);
      expect(battery.percentage).toBe(100); // Capped at 100%
    });

    it('should throw error for invalid data length', () => {
      const data = new Uint8Array([0x01]); // Only 1 byte

      expect(() => parseBatteryVoltage(data)).toThrow('Invalid battery voltage data length');
    });
  });

  describe('parseFirmwareVersion', () => {
    it('should parse firmware version', () => {
      const data = new Uint8Array([1, 2, 3]);

      const version = parseFirmwareVersion(data);

      expect(version.major).toBe(1);
      expect(version.minor).toBe(2);
      expect(version.patch).toBe(3);
      expect(version.version).toBe('1.2.3');
    });

    it('should parse version with zero values', () => {
      const data = new Uint8Array([0, 0, 0]);

      const version = parseFirmwareVersion(data);

      expect(version.major).toBe(0);
      expect(version.minor).toBe(0);
      expect(version.patch).toBe(0);
      expect(version.version).toBe('0.0.0');
    });

    it('should parse version with high numbers', () => {
      const data = new Uint8Array([10, 25, 99]);

      const version = parseFirmwareVersion(data);

      expect(version.major).toBe(10);
      expect(version.minor).toBe(25);
      expect(version.patch).toBe(99);
      expect(version.version).toBe('10.25.99');
    });

    it('should throw error for invalid data length', () => {
      const data = new Uint8Array([1, 2]); // Only 2 bytes

      expect(() => parseFirmwareVersion(data)).toThrow('Invalid firmware version data length');
    });
  });
});
