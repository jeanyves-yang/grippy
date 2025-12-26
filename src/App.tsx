import { useState, useEffect } from 'react'
import { TindeqClient, ConnectionState, StreamState } from './lib/tindeq-client'
import { MockTindeqClient } from './lib/mock-tindeq-client'
import type { WeightMeasurement, BatteryInfo } from './lib/tindeq-protocol'
import { MeasurementPanel } from './components/MeasurementPanel'
import './styles/App.scss'

// Enable demo mode via URL parameter: ?demo=true
const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'true'

function App() {
  const [client] = useState(() => isDemoMode ? new MockTindeqClient() as any : new TindeqClient())
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
    client.setErrorCallback((err: Error) => setError(err.message))
    client.setWeightDataCallback((measurement: WeightMeasurement) => {
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
      await client.tare()
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

  return (
    <div className="app">
      {/* Header with inline status */}
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <h1>Grippy</h1>
            <p className="subtitle">Tindeq Progressor Tracker</p>
          </div>

          <div className="header-status">
            {/* Connection inline */}
            <div className="connection-inline">
              <span className={`status-indicator ${connectionState}`}></span>
              <span className="status-text">{connectionState}</span>
              {!isConnected ? (
                <button onClick={handleConnect} disabled={!isBluetoothSupported} className="btn-primary btn-sm">
                  Connect
                </button>
              ) : (
                <button onClick={handleDisconnect} className="btn-secondary btn-sm">
                  Disconnect
                </button>
              )}
            </div>

            {/* Battery inline */}
            {isConnected && battery && (
              <div className="battery-inline">
                🔋 {battery.percentage}%
              </div>
            )}
          </div>
        </div>

        {!isBluetoothSupported && (
          <div className="warning">
            <strong>⚠️ Web Bluetooth not supported</strong> - Use Chrome, Edge, or Bluefy on iOS
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </header>

      <main className="main">
        {/* Graph fills remaining space */}
        {isConnected && (
          <MeasurementPanel
            currentWeight={currentWeight}
            peakWeight={peakWeight}
            measurements={measurements}
            streamState={streamState}
            onStart={handleStartMeasurement}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
          />
        )}
      </main>

      <footer className="footer">
        <p>Built with Web Bluetooth API • For iOS: Use Bluefy Browser</p>
      </footer>
    </div>
  )
}

export default App
