import type { ReactNode } from 'react'
import { useCountUp } from '../hooks/useCountUp'
// 1200 기준 구 CSS는 history/Simulation.css로 이동됨 — 1400 기준으로 새로 만들 것

interface CompactCardProps {
  label: string
  icon: ReactNode
  iconColor: string
  current: number
  total: number
  unit: string
  onClick?: () => void
}

function CompactCard({ label, icon, iconColor, current, total, unit, onClick }: CompactCardProps) {
  const progress = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0
  const currentDisplay = useCountUp(current)

  return (
    <div
      className="simulation-card simulation-card--compact"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="simulation-card__header">
        <span className="simulation-card__label">{label}</span>
        <span className="simulation-card__icon" style={{ color: iconColor }}>
          {icon}
        </span>
      </div>

      <div className="simulation-card__body">
        <div className="simulation-card__value-row">
          <span className="simulation-card__value">{currentDisplay.toLocaleString()}</span>
          <span className="simulation-card__unit">{unit}</span>
        </div>

        <div className="simulation-card__progress-track">
          <div className="simulation-card__progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}

export default CompactCard
