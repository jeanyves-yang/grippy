import { StreamState } from '../../lib/tindeq-client'
import type { WeightMeasurement } from '../../lib/tindeq-protocol'
import './MeasurementPanel.scss'

interface MeasurementPanelProps {
  currentWeight: number
  peakWeight: number
  measurements: WeightMeasurement[]
  streamState: StreamState
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

export function MeasurementPanel({
  currentWeight,
  peakWeight,
  measurements,
  streamState,
  onStart,
  onPause,
  onResume,
  onStop,
}: MeasurementPanelProps) {
  const isStreaming = streamState === StreamState.STREAMING
  const isPaused = streamState === StreamState.PAUSED

  return (
    <section className="measurement-panel section">
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
          <button onClick={onStart} className="btn-primary">
            Start Measurement
          </button>
        )}

        {isStreaming && (
          <>
            <button onClick={onPause} className="btn-secondary">
              Pause
            </button>
            <button onClick={onStop} className="btn-danger">
              Stop
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button onClick={onResume} className="btn-primary">
              Resume
            </button>
            <button onClick={onStop} className="btn-danger">
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
  )
}
