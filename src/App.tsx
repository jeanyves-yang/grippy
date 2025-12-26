import { useState, useEffect } from 'react'
import { TindeqClient, ConnectionState, StreamState } from './lib/tindeq-client'
import type { WeightMeasurement, BatteryInfo } from './lib/tindeq-protocol'

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
    <div className="max-w-3xl mx-auto px-4 min-h-screen flex flex-col">
      <header className="text-center py-8 border-b border-white/10">
        <h1 className="text-5xl font-bold mb-2">Grippy</h1>
        <p className="text-white/70">Tindeq Progressor Tracker</p>
      </header>

      {!isBluetoothSupported && (
        <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-300 p-4 rounded-lg my-4">
          <p className="font-semibold">⚠️ Web Bluetooth not supported</p>
          <p className="text-sm mt-1">Please use Chrome, Edge, or Bluefy browser on iOS</p>
        </div>
      )}

      <main className="flex-1 py-8">
        {/* Connection Section */}
        <section className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
          <h2 className="text-2xl font-semibold mb-4">Connection</h2>
          <div className="flex items-center gap-3 mb-4 text-lg font-medium capitalize">
            <span className={`w-3 h-3 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' :
              connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-gray-600'
            }`}></span>
            <span>{connectionState}</span>
          </div>

          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={!isBluetoothSupported}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all min-h-[44px] min-w-[120px] hover:-translate-y-0.5 active:translate-y-0"
            >
              Connect Device
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors min-h-[44px] min-w-[120px]"
            >
              Disconnect
            </button>
          )}

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500 text-red-300 p-4 rounded-lg">
              {error}
            </div>
          )}
        </section>

        {/* Device Info Section */}
        {isConnected && battery && (
          <section className="mb-8 p-6 bg-blue-500/5 rounded-xl border border-blue-500/20">
            <h3 className="text-xl font-semibold mb-3">Device Info</h3>
            <div className="flex items-center gap-2 text-lg">
              <span>Battery: {battery.percentage}%</span>
              <span className="text-white/60 text-base">({battery.voltage}mV)</span>
            </div>
            {battery.percentage !== undefined && battery.percentage < 20 && (
              <div className="mt-3 bg-yellow-500/10 border border-yellow-500 text-yellow-300 p-3 rounded-lg">
                ⚠️ Low battery
              </div>
            )}
          </section>
        )}

        {/* Measurement Section */}
        {isConnected && (
          <section className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
            <h2 className="text-2xl font-semibold mb-6">Measurement</h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center p-6 bg-white/3 rounded-lg border border-white/10">
                <label className="block text-sm uppercase tracking-wide text-white/70 mb-2">Current</label>
                <span className="block text-4xl font-bold tabular-nums">{currentWeight.toFixed(1)} kg</span>
              </div>
              <div className="text-center p-6 bg-white/3 rounded-lg border border-white/10">
                <label className="block text-sm uppercase tracking-wide text-white/70 mb-2">Peak</label>
                <span className="block text-4xl font-bold text-blue-500 tabular-nums">{peakWeight.toFixed(1)} kg</span>
              </div>
            </div>

            <div className="flex gap-4 justify-center flex-wrap">
              {streamState === StreamState.IDLE && (
                <button
                  onClick={handleStartMeasurement}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all min-h-[44px] min-w-[120px]"
                >
                  Start Measurement
                </button>
              )}

              {isStreaming && (
                <>
                  <button
                    onClick={handlePause}
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors min-h-[44px] min-w-[120px]"
                  >
                    Pause
                  </button>
                  <button
                    onClick={handleStop}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors min-h-[44px] min-w-[120px]"
                  >
                    Stop
                  </button>
                </>
              )}

              {isPaused && (
                <>
                  <button
                    onClick={handleResume}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all min-h-[44px] min-w-[120px]"
                  >
                    Resume
                  </button>
                  <button
                    onClick={handleStop}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors min-h-[44px] min-w-[120px]"
                  >
                    Stop
                  </button>
                </>
              )}
            </div>

            {/* Graph placeholder */}
            {measurements.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Force Curve</h3>
                <div className="text-center py-12 bg-white/2 border-2 border-dashed border-white/10 rounded-lg opacity-60">
                  <p className="text-lg mb-2">Graph visualization coming soon...</p>
                  <p className="text-sm text-white/60">{measurements.length} data points collected</p>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="text-center py-8 border-t border-white/10 text-white/60 text-sm">
        <p className="mb-1">Built with Web Bluetooth API</p>
        <p>For iOS: Use Bluefy Browser</p>
      </footer>
    </div>
  )
}

export default App
