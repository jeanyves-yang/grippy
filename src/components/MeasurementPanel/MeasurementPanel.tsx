import { StreamState } from '../../lib/tindeq-client'
import type { WeightMeasurement } from '../../lib/tindeq-protocol'
import { ForceGraph } from '../ForceGraph'
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

  // Calculate stats
  const maxWeight = peakWeight
  const avgWeight = measurements.length > 0
    ? measurements.reduce((sum, m) => sum + m.weight, 0) / measurements.length
    : 0

  return (
    <section className="measurement-panel section">
      {/* Force Graph - Hero Element */}
      <ForceGraph measurements={measurements} peakWeight={peakWeight} />

      {/* Stats Bar - Always visible */}
      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Current</span>
          <span className="stat-value">{currentWeight.toFixed(1)} kg</span>
        </div>
        <div className="stat">
          <span className="stat-label">Peak</span>
          <span className="stat-value highlight">{maxWeight.toFixed(1)} kg</span>
        </div>
        <div className="stat">
          <span className="stat-label">Average</span>
          <span className="stat-value">{avgWeight.toFixed(1)} kg</span>
        </div>
      </div>

      {/* Controls Bar - Always visible */}
      <div className="controls-bar">
        {streamState === StreamState.IDLE && (
          <button onClick={onStart} className="btn-primary">
            Start
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
    </section>
  )
}
