import './BatteryResultBadge.css'
import type { FinalLabel } from '../types'

interface BatteryResultBadgeProps {
  label: FinalLabel
}

function BatteryResultBadge({ label }: BatteryResultBadgeProps) {
  if (label === 'PASS') {
    return <span className="battery-result-badge battery-result-badge--pass">PASS</span>
  }

  if (label === 'REJECT') {
    return (
      <span className="battery-result-badge battery-result-badge--reject">
        <span className="battery-result-badge__dot" />
        REJECT
      </span>
    )
  }

  return (
    <span className="battery-result-badge battery-result-badge--fail">
      <span className="battery-result-badge__triangle" />
      FAIL
    </span>
  )
}

export { BatteryResultBadge }
