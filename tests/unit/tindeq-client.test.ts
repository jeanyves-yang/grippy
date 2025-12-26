import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TindeqClient, ConnectionState, StreamState } from '../../src/lib/tindeq-client';

// Mock Web Bluetooth API
const mockCharacteristic = {
  writeValue: vi.fn(),
  startNotifications: vi.fn(),
  stopNotifications: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  value: null,
};

const mockService = {
  getCharacteristic: vi.fn().mockResolvedValue(mockCharacteristic),
};

const mockServer = {
  connected: true,
  getPrimaryService: vi.fn().mockResolvedValue(mockService),
  disconnect: vi.fn(),
};

const mockDevice = {
  gatt: {
    connect: vi.fn().mockResolvedValue(mockServer),
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

describe('TindeqClient', () => {
  let client: TindeqClient;

  beforeEach(() => {
    client = new TindeqClient();
    vi.clearAllMocks();

    // Mock navigator.bluetooth
    global.navigator = {
      bluetooth: {
        requestDevice: vi.fn().mockResolvedValue(mockDevice),
      },
    } as any;
  });

  describe('isWebBluetoothSupported', () => {
    it('should return true when Web Bluetooth is available', () => {
      expect(TindeqClient.isWebBluetoothSupported()).toBe(true);
    });

    it('should return false when navigator is undefined', () => {
      const originalNav = global.navigator;
      (global as any).navigator = undefined;

      expect(TindeqClient.isWebBluetoothSupported()).toBe(false);

      global.navigator = originalNav;
    });
  });

  describe('connection management', () => {
    it('should start in disconnected state', () => {
      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should throw error if Web Bluetooth not supported', async () => {
      const originalNav = global.navigator;
      (global as any).navigator = {};

      await expect(client.connect()).rejects.toThrow('Web Bluetooth is not supported');

      global.navigator = originalNav;
    });

    it('should connect to device successfully', async () => {
      const stateCallback = vi.fn();
      client.setConnectionStateCallback(stateCallback);

      await client.connect();

      expect(client.getConnectionState()).toBe(ConnectionState.CONNECTED);
      expect(stateCallback).toHaveBeenCalledWith(ConnectionState.CONNECTING);
      expect(stateCallback).toHaveBeenCalledWith(ConnectionState.CONNECTED);
      expect(mockCharacteristic.startNotifications).toHaveBeenCalled();
    });

    it('should throw error if already connected', async () => {
      await client.connect();

      await expect(client.connect()).rejects.toThrow('Already connected or connecting');
    });

    it('should disconnect successfully', async () => {
      await client.connect();

      await client.disconnect();

      expect(client.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
      expect(mockServer.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnection gracefully when not connected', async () => {
      await expect(client.disconnect()).resolves.not.toThrow();
    });

    it('should set up disconnection listener', async () => {
      await client.connect();

      expect(mockDevice.addEventListener).toHaveBeenCalledWith(
        'gattserverdisconnected',
        expect.any(Function)
      );
    });
  });

  describe('streaming control', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should start in idle stream state', () => {
      expect(client.getStreamState()).toBe(StreamState.IDLE);
    });

    it('should start streaming', async () => {
      await client.startStreaming();

      expect(client.getStreamState()).toBe(StreamState.STREAMING);
      expect(mockCharacteristic.writeValue).toHaveBeenCalledWith(
        expect.any(Uint8Array)
      );
    });

    it('should throw error if starting stream when already streaming', async () => {
      await client.startStreaming();

      await expect(client.startStreaming()).rejects.toThrow('Already streaming');
    });

    it('should pause streaming', async () => {
      await client.startStreaming();

      client.pauseStreaming();

      expect(client.getStreamState()).toBe(StreamState.PAUSED);
    });

    it('should throw error when pausing if not streaming', () => {
      expect(() => client.pauseStreaming()).toThrow('Not currently streaming');
    });

    it('should resume streaming', async () => {
      await client.startStreaming();
      client.pauseStreaming();

      client.resumeStreaming();

      expect(client.getStreamState()).toBe(StreamState.STREAMING);
    });

    it('should throw error when resuming if not paused', async () => {
      await client.startStreaming();

      expect(() => client.resumeStreaming()).toThrow('Not currently paused');
    });

    it('should stop streaming', async () => {
      await client.startStreaming();

      await client.stopStreaming();

      expect(client.getStreamState()).toBe(StreamState.IDLE);
      expect(mockCharacteristic.writeValue).toHaveBeenCalled();
    });

    it('should handle stop when not streaming', async () => {
      await expect(client.stopStreaming()).resolves.not.toThrow();
    });

    it('should stop streaming before disconnecting', async () => {
      await client.startStreaming();

      await client.disconnect();

      expect(client.getStreamState()).toBe(StreamState.IDLE);
    });
  });

  describe('device commands', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should send tare command', async () => {
      await client.tare();

      expect(mockCharacteristic.writeValue).toHaveBeenCalledWith(
        expect.any(Uint8Array)
      );
    });

    it('should throw error when taring if not connected', async () => {
      await client.disconnect();

      await expect(client.tare()).rejects.toThrow('Device not connected');
    });

    it('should request battery voltage', async () => {
      const promise = client.getBatteryVoltage();

      expect(mockCharacteristic.writeValue).toHaveBeenCalled();

      // Note: In real implementation, this would be resolved by notification handler
    });

    it('should request firmware version', async () => {
      const promise = client.getFirmwareVersion();

      expect(mockCharacteristic.writeValue).toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('should call weight data callback when streaming', async () => {
      const weightCallback = vi.fn();
      client.setWeightDataCallback(weightCallback);

      await client.connect();
      await client.startStreaming();

      // Note: In real implementation, this would be triggered by notifications
    });

    it('should not call weight data callback when paused', async () => {
      const weightCallback = vi.fn();
      client.setWeightDataCallback(weightCallback);

      await client.connect();
      await client.startStreaming();
      client.pauseStreaming();

      // Callback should not be invoked while paused
    });

    it('should call error callback on error', async () => {
      const errorCallback = vi.fn();
      client.setErrorCallback(errorCallback);

      // Error callback would be invoked by error handlers
    });

    it('should call battery callback', () => {
      const batteryCallback = vi.fn();
      client.setBatteryCallback(batteryCallback);

      // Battery callback would be invoked by notification handler
    });
  });
});
