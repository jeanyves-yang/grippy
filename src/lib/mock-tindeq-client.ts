/**
 * Mock Tindeq Client for testing without physical device
 * Simulates realistic weight measurements for development
 */

import { ConnectionState, StreamState } from './tindeq-client'
import type { WeightMeasurement, BatteryInfo, FirmwareVersion } from './tindeq-protocol'

export class MockTindeqClient {
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED
  private streamState: StreamState = StreamState.IDLE
  private intervalId: NodeJS.Timeout | null = null
  private simulationStartTime: number = 0

  private onConnectionStateChange?: (state: ConnectionState) => void
  private onWeightData?: (measurement: WeightMeasurement) => void
  private onBatteryUpdate?: (battery: BatteryInfo) => void

  static isWebBluetoothSupported(): boolean {
    return true // Always supported in demo mode
  }

  setConnectionStateCallback(callback: (state: ConnectionState) => void): void {
    this.onConnectionStateChange = callback
  }

  setWeightDataCallback(callback: (measurement: WeightMeasurement) => void): void {
    this.onWeightData = callback
  }

  setErrorCallback(_callback: (error: Error) => void): void {
    // Mock doesn't use error callback
  }

  setBatteryCallback(callback: (battery: BatteryInfo) => void): void {
    this.onBatteryUpdate = callback
  }

  getConnectionState(): ConnectionState {
    return this.connectionState
  }

  getStreamState(): StreamState {
    return this.streamState
  }

  async connect(): Promise<void> {
    if (this.connectionState !== ConnectionState.DISCONNECTED) {
      throw new Error('Already connected or connecting')
    }

    this.setConnectionState(ConnectionState.CONNECTING)

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 500))

    this.setConnectionState(ConnectionState.CONNECTED)
  }

  async disconnect(): Promise<void> {
    if (this.connectionState === ConnectionState.DISCONNECTED) {
      return
    }

    this.setConnectionState(ConnectionState.DISCONNECTING)

    if (this.streamState === StreamState.STREAMING) {
      await this.stopStreaming()
    }

    this.setConnectionState(ConnectionState.DISCONNECTED)
  }

  async tare(): Promise<void> {
    // Simulate tare command
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  async startStreaming(): Promise<void> {
    if (this.connectionState !== ConnectionState.CONNECTED) {
      throw new Error('Device not connected')
    }

    if (this.streamState === StreamState.STREAMING) {
      throw new Error('Already streaming')
    }

    this.streamState = StreamState.STREAMING
    this.simulationStartTime = Date.now()
    this.startSimulation()
  }

  pauseStreaming(): void {
    if (this.streamState !== StreamState.STREAMING) {
      throw new Error('Not currently streaming')
    }
    this.streamState = StreamState.PAUSED
  }

  resumeStreaming(): void {
    if (this.streamState !== StreamState.PAUSED) {
      throw new Error('Not currently paused')
    }
    this.streamState = StreamState.STREAMING
  }

  async stopStreaming(): Promise<void> {
    if (this.streamState === StreamState.IDLE) {
      return
    }

    this.stopSimulation()
    this.streamState = StreamState.IDLE
  }

  async getBatteryVoltage(): Promise<BatteryInfo> {
    const battery = {
      voltage: 3850,
      percentage: 71,
    }

    if (this.onBatteryUpdate) {
      this.onBatteryUpdate(battery)
    }

    return battery
  }

  async getFirmwareVersion(): Promise<FirmwareVersion> {
    return {
      major: 2,
      minor: 0,
      patch: 4,
      version: '2.0.4',
    }
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(state)
    }
  }

  private startSimulation(): void {
    // Send batches of 15 measurements every ~100ms (like real device)
    this.intervalId = setInterval(() => {
      if (this.streamState === StreamState.STREAMING && this.onWeightData) {
        const batch = this.generateMeasurementBatch()
        batch.forEach(measurement => this.onWeightData!(measurement))
      }
    }, 100)
  }

  private stopSimulation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private generateMeasurementBatch(): WeightMeasurement[] {
    const measurements: WeightMeasurement[] = []
    const elapsed = (Date.now() - this.simulationStartTime) / 1000 // seconds

    // Simulate realistic hang: ramp up, hold, release
    for (let i = 0; i < 15; i++) {
      const t = elapsed + (i * 0.01) // Add small time offset per measurement
      let weight = 0

      if (t < 1) {
        // Ramp up (0-1s)
        weight = t * 30
      } else if (t < 5) {
        // Hold with slight variation (1-5s)
        weight = 30 + Math.sin(t * 5) * 5 + Math.random() * 2
      } else if (t < 6) {
        // Release (5-6s)
        weight = 30 * (1 - (t - 5))
      } else {
        // Rest
        weight = Math.random() * 0.5
      }

      measurements.push({
        weight: Math.max(0, weight),
        timestamp: Date.now() + (i * 10),
      })
    }

    return measurements
  }
}
