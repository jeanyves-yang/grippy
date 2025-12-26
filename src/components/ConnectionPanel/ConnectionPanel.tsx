import { ConnectionState } from '../../lib/tindeq-client'
import './ConnectionPanel.scss'

interface ConnectionPanelProps {
  connectionState: ConnectionState
  isBluetoothSupported: boolean
  onConnect: () => void
  onDisconnect: () => void
  error: string | null
}

export function ConnectionPanel({
  connectionState,
  isBluetoothSupported,
  onConnect,
  onDisconnect,
  error,
}: ConnectionPanelProps) {
  const isConnected = connectionState === ConnectionState.CONNECTED

  return (
    <section className="connection-panel section">
      <h2>Connection</h2>

      <div className="connection-status">
        <span className={`status-indicator ${connectionState}`}></span>
        <span>{connectionState}</span>
      </div>

      {!isConnected ? (
        <button
          onClick={onConnect}
          disabled={!isBluetoothSupported}
          className="btn-primary"
        >
          Connect Device
        </button>
      ) : (
        <button onClick={onDisconnect} className="btn-secondary">
          Disconnect
        </button>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </section>
  )
}
