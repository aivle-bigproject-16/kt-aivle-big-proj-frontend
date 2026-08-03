import { useSimulationStore } from '../store/useSimulationStore'
import { useCountUp } from '../hooks/useCountUp'
import { useProcessStatusLabel } from '../hooks/useProcessStatus'
import { useMeasuredWidth } from '../hooks/useMeasuredWidth'
import './AnalyzePanel.css'

export function AnalyzePanel() {
  const analyze = useSimulationStore(s => s.analyze)
  const today = new Date().toISOString().slice(0, 10)
  const statusLabel = useProcessStatusLabel()

  /* Cell ID는 점진적 카운트업이 아니라 값이 바뀔 때 팝업으로 등장한다 */
  const cellIdDisplay = analyze?.batteryCellId ?? 0
  /* retryCount는 WS 모델에 추가 예정 — 내려오기 전까지는 0 */
  const retryDisplay = useCountUp(analyze?.retryCount ?? 0)

  /* Cell ID 바만 행 폭에 맞춘다. Retry count 바는 171px(17.1rem) 고정 — CSS 참고 */
  const [cellIdRef, cellIdBarWidth] = useMeasuredWidth<HTMLDivElement>()


  return (
    <div className="analyze-panel">
      <div className="analyze-card">
        <div className="analyze-info">
          <div className="analyze-info__header">
            <p className="analyze-info__title">ANALYZE Section</p>
            <p className="analyze-info__date">셀 분석 영역 {today}</p>
          </div>

          <div className="analyze-info__metrics">


            <div className="analyze-metric analyze-metric--retry">
              <div className="analyze-metric__row">
                <span className="analyze-metric__label analyze-metric__label--retry">Retry count</span>
                <span className="analyze-metric__value">{retryDisplay}</span>
              </div>
              <div className="analyze-metric__bar" />
            </div>
                        <div className="analyze-metric analyze-metric--cell-id">
              <div ref={cellIdRef} className="analyze-metric__row">
                <span className="analyze-metric__label analyze-metric__label--cell-id">Cell ID</span>
                <span key={cellIdDisplay} className="analyze-metric__value analyze-metric__value--pop">{cellIdDisplay}</span>
              </div>
              <div className="analyze-metric__bar" style={cellIdBarWidth ? { width: cellIdBarWidth } : undefined} />
            </div>
          </div>
        </div>

        <div className="analyze-detail">
          <p className="analyze-detail__title">
            {analyze
              ? `BATCH ${analyze.batchId} - Cell ID ${analyze.batteryCellId}`
              : statusLabel}
          </p>

          <div className="analyze-detail__battery">
            <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              {/* Battery Cap (Metallic Grey) */}
              <rect x="42" y="8" width="16" height="6" rx="2" fill="#94a3b8" />
              {/* Battery Body Outline (Emerald Green) */}
              <rect x="30" y="14" width="40" height="78" rx="4" fill="none" stroke="#2ecc71" strokeWidth="3" />
              {/* Battery Fill — 분석 중임을 나타내는 충전 애니메이션 */}
              <rect x="33" width="34" rx="2" fill="#2ecc71">
                <animate attributeName="y" values="85;17;85" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="height" values="4;72;4" dur="2.4s" repeatCount="indefinite" />
              </rect>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
