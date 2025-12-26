import { useState, useEffect } from 'react'
import { TindeqClient, ConnectionState, StreamState } from './lib/tindeq-client'
import type { WeightMeasurement, BatteryInfo } from './lib/tindeq-protocol'
import './styles/App.scss'

function App() {
  const [client] = useState(() => new TindeqClient())
  const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED)
  const [streamState, setStreamState] = useState(StreamState.IDLE)
  const [currentWeight, setCurrentWeight] = useState<number>(0)
  const [peakWeight, setPeakWeight] = useState<number>(0)
  const [measurements, setMeasurements] = useState<WeightMeasurement[]>([])
  const [battery, setBattery] = useState<BatteryInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isBluetoothSupported] = useState(TindeqClient.isWebBluetoothSupported())

  useEffect(() => {
    client.setConnectionStateCallback(setConnectionState)
    client.setErrorCallback((err) => setError(err.message))
    client.setWeightDataCallback((measurement) => {
      // Clamp negative values to zero (can't have negative force)
      const weight = Math.max(0, measurement.weight)
      setCurrentWeight(weight)
      setPeakWeight(prev => Math.max(prev, weight))
      setMeasurements(prev => [...prev, { ...measurement, weight }])
    })
    client.setBatteryCallback(setBattery)

    return () => {
      client.disconnect()
    }
  }, [client])

  const handleConnect = async () => {
    try {
      setError(null)
      await client.connect()
      // Get battery info after connecting
      const batteryInfo = await client.getBatteryVoltage()
      setBattery(batteryInfo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    }
  }

  const handleDisconnect = async () => {
    try {
      await client.disconnect()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect')
    }
  }

  const handleStartMeasurement = async () => {
    try {
      setError(null)
      setPeakWeight(0)
      setMeasurements([])
      await client.tare() // Zero the scale
      await client.startStreaming()
      setStreamState(client.getStreamState())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start measurement')
    }
  }

  const handlePause = () => {
    try {
      client.pauseStreaming()
      setStreamState(client.getStreamState())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause')
    }
  }

  const handleResume = () => {
    try {
      client.resumeStreaming()
      setStreamState(client.getStreamState())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume')
    }
  }

  const handleStop = async () => {
    try {
      await client.stopStreaming()
      setStreamState(client.getStreamState())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop')
    }
  }

  const isConnected = connectionState === ConnectionState.CONNECTED
  const isStreaming = streamState === StreamState.STREAMING
  const isPaused = streamState === StreamState.PAUSED

  return (
    <div className="app">
      <header className="header">
        <h1>Grippy</h1>
        <p className="subtitle">Tindeq Progressor Tracker</p>
      </header>

      {!isBluetoothSupported && (
        <div className="warning">
          <p><strong>⚠️ Web Bluetooth not supported</strong></p>
          <p>Please use Chrome, Edge, or Bluefy browser on iOS</p>
        </div>
      )}

      <main className="main">
        {/* Connection Section */}
        <section className="section">
          <h2>Connection</h2>
          <div className="connection-status">
            <span className={`status-indicator ${connectionState}`}></span>
            <span>{connectionState}</span>
          </div>

          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={!isBluetoothSupported}
              className="btn-primary"
            >
              Connect Device
            </button>
          ) : (
            <button onClick={handleDisconnect} className="btn-secondary">
              Disconnect
            </button>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </section>

        {/* Device Info Section */}
        {isConnected && battery && (
          <section className="section device-info">
            <h3>Device Info</h3>
            <div className="battery-info">
              <span>Battery: {battery.percentage}%</span>
              <span className="battery-voltage">({battery.voltage}mV)</span>
            </div>
            {battery.percentage !== undefined && battery.percentage < 20 && (
              <div className="warning">⚠️ Low battery</div>
            )}
          </section>
        )}

        {/* Measurement Section */}
        {isConnected && (
          <section className="section">
            <h2>Measurement</h2>

            <div className="measurement-display">
              <div className="weight-card">
                <label>Current</label>
                <span className="value">{currentWeight.toFixed(1)} kg</span>
              </div>
              <div className="weight-card">
                <label>Peak</label>
                <span className="value highlight">{peakWeight.toFixed(1)} kg</span>
              </div>
            </div>

            <div className="controls">
              {streamState === StreamState.IDLE && (
                <button onClick={handleStartMeasurement} className="btn-primary">
                  Start Measurement
                </button>
              )}

              {isStreaming && (
                <>
                  <button onClick={handlePause} className="btn-secondary">
                    Pause
                  </button>
                  <button onClick={handleStop} className="btn-danger">
                    Stop
                  </button>
                </>
              )}

              {isPaused && (
                <>
                  <button onClick={handleResume} className="btn-primary">
                    Resume
                  </button>
                  <button onClick={handleStop} className="btn-danger">
                    Stop
                  </button>
                </>
              )}
            </div>

            {/* Graph placeholder */}
            {measurements.length > 0 && (
              <div className="graph-container">
                <h3>Force Curve</h3>
                <div className="graph-placeholder">
                  <p>Graph visualization coming soon...</p>
                  <p>{measurements.length} data points collected</p>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Built with Web Bluetooth API</p>
        <p>For iOS: Use Bluefy Browser</p>
      </footer>
    </div>
  )
}

export default App
