import { useEffect, useState, type ReactNode } from 'react'
import { useCountUp } from '../hooks/useCountUp'
import './Simulation.css'

interface SimulationCardProps {
  label: string
  icon: ReactNode
  iconColor: string
  current: number
  total: number
  unit: string
  /** 지정하면 current/total 비율 대신, 이 시간(초) 동안 0→100%로 채워지는 애니메이션 바를 사용한다. */
  progressDurationSec?: number
  /** progressDurationSec 사용 시 이 값이 바뀔 때마다 애니메이션을 처음부터 다시 시작한다(예: 새 배치의 batchId). */
  progressKey?: string | number
  /** 하단에 표시할 현재 배치 ID. 지정하면 프로그레스 바 아래에 노출된다. */
  batchId?: number | null
  onClick?: () => void
}

function SimulationCard({
  label,
  icon,
  iconColor,
  current,
  total,
  unit,
  progressDurationSec,
  progressKey,
  batchId,
  onClick,
}: SimulationCardProps) {
  const [displayBatchId, setDisplayBatchId] = useState<number | null>(batchId ?? null)
  const [isBatchIdVisible, setIsBatchIdVisible] = useState(batchId != null)
  const currentDisplay = useCountUp(current)

  useEffect(() => {
    if (batchId != null) {
      setDisplayBatchId(batchId)
      setIsBatchIdVisible(true)
      return
    }

    setIsBatchIdVisible(false)
    const hideTimer = setTimeout(() => setDisplayBatchId(null), 180)
    return () => clearTimeout(hideTimer)
  }, [batchId])

  const progress = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0
  const isTimed = progressDurationSec != null && progressDurationSec > 0

  return (
    <div
      className="simulation-card"
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

        <div className="simulation-card__footer-row">
          <div className="simulation-card__progress-track">
            {isTimed ? (
              <div
                key={progressKey}
                className="simulation-card__progress-fill simulation-card__progress-fill--timed"
                style={{ animationDuration: `${progressDurationSec}s` }}
              />
            ) : (
              <div className="simulation-card__progress-fill" style={{ width: `${progress}%` }} />
            )}
          </div>
        </div>
      </div>
      <div className="simulation-card__batch-id-area">
        <span
          className={`simulation-card__batch-id ${
            isBatchIdVisible ? 'simulation-card__batch-id--visible' : 'simulation-card__batch-id--hidden'
          }`}
        >
          {displayBatchId != null ? `Batch ID : ${displayBatchId}` : ''}
        </span>
      </div>
    </div>
  )
}

export default SimulationCard
