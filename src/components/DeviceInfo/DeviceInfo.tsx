import type { BatteryInfo } from '../../lib/tindeq-protocol'
import './DeviceInfo.scss'

interface DeviceInfoProps {
  battery: BatteryInfo | null
}

export function DeviceInfo({ battery }: DeviceInfoProps) {
  if (!battery) return null

  return (
    <section className="device-info section">
      <h3>Device Info</h3>
      <div className="battery-info">
        <span>Battery: {battery.percentage}%</span>
        <span className="battery-voltage">({battery.voltage}mV)</span>
      </div>
      {battery.percentage !== undefined && battery.percentage < 20 && (
        <div className="warning">⚠️ Low battery</div>
      )}
    </section>
  )
}
