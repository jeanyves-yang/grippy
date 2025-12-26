/**
 * Tindeq Progressor Bluetooth Client
 * Handles Web Bluetooth connection and communication with Tindeq Progressor device
 */

import {
  PROGRESSOR_SERVICE_UUID,
  DATA_CHARACTERISTIC_UUID,
  CONTROL_CHARACTERISTIC_UUID,
  DEVICE_NAME_PREFIX,
  CommandTag,
  ResponseTag,
  encodeCommand,
  decodeResponse,
  parseWeightMeasurements,
  parseBatteryVoltage,
  type WeightMeasurement,
  type BatteryInfo,
  type FirmwareVersion,
} from './tindeq-protocol';

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
}

export enum StreamState {
  IDLE = 'idle',
  STREAMING = 'streaming',
  PAUSED = 'paused',
}

export type ConnectionStateCallback = (state: ConnectionState) => void;
export type WeightDataCallback = (measurement: WeightMeasurement) => void;
export type ErrorCallback = (error: Error) => void;
export type BatteryCallback = (battery: BatteryInfo) => void;

export class TindeqClient {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private dataCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private controlCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private streamState: StreamState = StreamState.IDLE;

  private onConnectionStateChange?: ConnectionStateCallback;
  private onWeightData?: WeightDataCallback;
  private onError?: ErrorCallback;
  private onBatteryUpdate?: BatteryCallback;

  /**
   * Check if Web Bluetooth API is available
   */
  static isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Set connection state change callback
   */
  setConnectionStateCallback(callback: ConnectionStateCallback): void {
    this.onConnectionStateChange = callback;
  }

  /**
   * Set weight data callback
   */
  setWeightDataCallback(callback: WeightDataCallback): void {
    this.onWeightData = callback;
  }

  /**
   * Set error callback
   */
  setErrorCallback(callback: ErrorCallback): void {
    this.onError = callback;
  }

  /**
   * Set battery update callback
   */
  setBatteryCallback(callback: BatteryCallback): void {
    this.onBatteryUpdate = callback;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get current stream state
   */
  getStreamState(): StreamState {
    return this.streamState;
  }

  /**
   * Connect to a Tindeq Progressor device
   */
  async connect(): Promise<void> {
    if (!TindeqClient.isWebBluetoothSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    if (this.connectionState !== ConnectionState.DISCONNECTED) {
      throw new Error('Already connected or connecting');
    }

    try {
      this.setConnectionState(ConnectionState.CONNECTING);

      // Request device
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: DEVICE_NAME_PREFIX },
          { services: [PROGRESSOR_SERVICE_UUID] },
        ],
        optionalServices: [PROGRESSOR_SERVICE_UUID],
      });

      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnection);

      // Connect to GATT server
      this.server = await this.device.gatt?.connect() ?? null;
      if (!this.server) {
        throw new Error('Failed to connect to GATT server');
      }

      // Get service
      const service = await this.server.getPrimaryService(PROGRESSOR_SERVICE_UUID);

      // Get characteristics
      this.dataCharacteristic = await service.getCharacteristic(DATA_CHARACTERISTIC_UUID);
      this.controlCharacteristic = await service.getCharacteristic(CONTROL_CHARACTERISTIC_UUID);

      // Start notifications on data characteristic
      await this.dataCharacteristic.startNotifications();
      this.dataCharacteristic.addEventListener('characteristicvaluechanged', this.handleDataNotification);

      this.setConnectionState(ConnectionState.CONNECTED);
    } catch (error) {
      this.setConnectionState(ConnectionState.DISCONNECTED);
      this.cleanup();
      throw error instanceof Error ? error : new Error('Failed to connect to device');
    }
  }

  /**
   * Disconnect from device
   */
  async disconnect(): Promise<void> {
    if (this.connectionState === ConnectionState.DISCONNECTED) {
      return;
    }

    try {
      this.setConnectionState(ConnectionState.DISCONNECTING);

      // Stop streaming if active
      if (this.streamState === StreamState.STREAMING) {
        await this.stopStreaming();
      }

      // Disconnect
      if (this.server?.connected) {
        this.server.disconnect();
      }
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Disconnect failed'));
    } finally {
      this.cleanup();
      this.setConnectionState(ConnectionState.DISCONNECTED);
    }
  }

  /**
   * Tare the scale (zero it)
   */
  async tare(): Promise<void> {
    this.ensureConnected();
    const command = encodeCommand(CommandTag.TARE_SCALE);
    await this.controlCharacteristic!.writeValue(command);
  }

  /**
   * Start streaming weight measurements
   */
  async startStreaming(): Promise<void> {
    this.ensureConnected();

    if (this.streamState === StreamState.STREAMING) {
      throw new Error('Already streaming');
    }

    const command = encodeCommand(CommandTag.START_WEIGHT_MEASUREMENT);
    await this.controlCharacteristic!.writeValue(command);
    this.streamState = StreamState.STREAMING;
  }

  /**
   * Pause streaming (stops UI updates but keeps connection)
   */
  pauseStreaming(): void {
    if (this.streamState !== StreamState.STREAMING) {
      throw new Error('Not currently streaming');
    }
    this.streamState = StreamState.PAUSED;
  }

  /**
   * Resume streaming
   */
  resumeStreaming(): void {
    if (this.streamState !== StreamState.PAUSED) {
      throw new Error('Not currently paused');
    }
    this.streamState = StreamState.STREAMING;
  }

  /**
   * Stop streaming weight measurements
   */
  async stopStreaming(): Promise<void> {
    this.ensureConnected();

    if (this.streamState === StreamState.IDLE) {
      return;
    }

    const command = encodeCommand(CommandTag.STOP_WEIGHT_MEASUREMENT);
    await this.controlCharacteristic!.writeValue(command);
    this.streamState = StreamState.IDLE;
  }

  /**
   * Get battery voltage
   */
  async getBatteryVoltage(): Promise<BatteryInfo> {
    this.ensureConnected();
    const command = encodeCommand(CommandTag.GET_BATTERY_VOLTAGE);
    await this.controlCharacteristic!.writeValue(command);

    // Battery response will come through data notification
    return new Promise((resolve) => {
      const originalCallback = this.onBatteryUpdate;
      this.onBatteryUpdate = (battery) => {
        this.onBatteryUpdate = originalCallback;
        resolve(battery);
        if (originalCallback) {
          originalCallback(battery);
        }
      };
    });
  }

  /**
   * Get firmware version
   */
  async getFirmwareVersion(): Promise<FirmwareVersion> {
    this.ensureConnected();
    const command = encodeCommand(CommandTag.GET_APP_VERSION);
    await this.controlCharacteristic!.writeValue(command);

    // Version response will come through data notification
    return new Promise((resolve) => {
      // TODO: Implement proper promise-based response handling
      setTimeout(() => resolve({ major: 0, minor: 0, patch: 0, version: '0.0.0' }), 100);
    });
  }

  private handleDataNotification = (event: Event): void => {
    try {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      const value = target.value;
      if (!value) return;

      const response = decodeResponse(value);
      console.log('Received response:', { tag: response.tag, length: response.length, streamState: this.streamState });

      switch (response.tag) {
        case ResponseTag.WEIGHT_MEASUREMENT:
          if (this.streamState === StreamState.STREAMING && this.onWeightData) {
            try {
              const measurements = parseWeightMeasurements(response.data);
              console.log(`Parsed ${measurements.length} measurements, latest:`, measurements[measurements.length - 1]);
              // Call callback for each measurement in the batch
              measurements.forEach(measurement => this.onWeightData!(measurement));
            } catch (error) {
              console.error('Failed to parse weight:', error);
              console.log('Data length:', response.data.length, 'bytes:', Array.from(response.data.slice(0, 32)));
            }
          }
          break;

        case ResponseTag.CMD_RESPONSE:
          // Generic command response - could be battery, version, etc.
          // For now, try to parse as battery if we're expecting it
          if (response.length === 2 && this.onBatteryUpdate) {
            try {
              const battery = parseBatteryVoltage(response.data);
              this.onBatteryUpdate(battery);
            } catch (e) {
              // Not battery data
            }
          }
          break;

        case ResponseTag.LOW_BATTERY_WARNING:
          this.handleError(new Error('Low battery warning'));
          break;

        default:
          console.warn('Unknown response tag:', response.tag);
      }
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Data notification error'));
    }
  };

  private handleDisconnection = (): void => {
    this.cleanup();
    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.handleError(new Error('Device disconnected'));
  };

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(state);
    }
  }

  private handleError(error: Error): void {
    if (this.onError) {
      this.onError(error);
    } else {
      console.error('TindeqClient error:', error);
    }
  }

  private ensureConnected(): void {
    if (this.connectionState !== ConnectionState.CONNECTED) {
      throw new Error('Device not connected');
    }
  }

  private cleanup(): void {
    if (this.dataCharacteristic) {
      this.dataCharacteristic.removeEventListener('characteristicvaluechanged', this.handleDataNotification);
      this.dataCharacteristic = null;
    }

    if (this.device) {
      this.device.removeEventListener('gattserverdisconnected', this.handleDisconnection);
    }

    this.controlCharacteristic = null;
    this.server = null;
    this.device = null;
    this.streamState = StreamState.IDLE;
  }
}
