import { useSimulationStore } from '../store/useSimulationStore'
import './OverviewPending.css'

/** 오버뷰 카드 — 420×230 흰 카드. 내부는 5개 영역이 세로로 정렬된다:
   헤더 / 스테이터스 / 스테이터스 바 / progress / 푸터 */
function OverviewPending() {
  const pendingCount = useSimulationStore((s) => s.registered.length)
  const totalCount = useSimulationStore((s) => s.batteryCellCount)
  const ratio = totalCount > 0 ? pendingCount / totalCount : 0
  /* 캡처로 넘어갈 다음 배치 — 대기열 맨 앞(FIFO) 셀의 배치 id */
  const nextBatchId = useSimulationStore((s) => s.registered[0]?.batchId)

  return (
    <div className="overview-pending">
      <div className="overview-pending__header">
        <div className="overview-pending__header-left">
          <span className="overview-pending__dot" />
          <span className="overview-pending__label">대기</span>
          <span className="overview-pending__sublabel">PENDING</span>
        </div>
        <div className="overview-pending__logo">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="1" y1="5" x2="13" y2="5" stroke="#6B7280" strokeWidth="1" strokeLinecap="round" />
            <line x1="1" y1="10" x2="8" y2="10" stroke="#6B7280" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div className="overview-pending__status">
        <div className="overview-pending__status-left">
          <span className="overview-pending__count">{pendingCount}</span>
          <span className="overview-pending__unit">units</span>
        </div>
        <span className="overview-pending__total">/ {totalCount} total</span>
      </div>
      <div className="overview-pending__status-bar">
        <div className="overview-pending__status-bar-fill" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="overview-pending__progress" />
      <div className="overview-pending__footer">
        <span className="overview-pending__footer-hint">큐 선두 36셀 표시 · +66</span>
        <span className="overview-pending__footer-batch">
          {nextBatchId !== undefined ? `Batch #${nextBatchId} 대기` : '대기 배치 없음'}
        </span>
      </div>
    </div>
  )
}

export { OverviewPending }
