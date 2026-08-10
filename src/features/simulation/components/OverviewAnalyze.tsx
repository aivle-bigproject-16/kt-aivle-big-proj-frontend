import { useSimulationStore } from '../store/useSimulationStore'
import './OverviewAnalyze.css'

/** 오버뷰 카드 — 420×230 흰 카드. 내부는 5개 영역이 세로로 정렬된다:
   헤더 / 스테이터스 / 스테이터스 바 / progress / 푸터 */
function OverviewAnalyze({ onClick }: { onClick?: () => void }) {
  /* 현재 분석 중인 셀 개수 — analyze는 슬롯 하나뿐이라 있으면 1, 없으면 0 */
  const analyzingCount = useSimulationStore((s) => (s.analyze ? 1 : 0))
  const totalCount = useSimulationStore((s) => s.batteryCellCount)
  const completedCount = useSimulationStore((s) => s.completed.length)
  const ratio = totalCount > 0 ? completedCount / totalCount : 0

  const analyzeCellId = useSimulationStore((s) => s.analyze?.batteryCellId)
  const analyzeBatchId = useSimulationStore((s) => s.analyze?.batchId)

  return (
    <button type="button" className="overview-analyze" onClick={onClick}>
      <div className="overview-analyze__header">
        <div className="overview-analyze__header-left">
          <span className="overview-analyze__dot" />
          <span className="overview-analyze__label">분석</span>
          <span className="overview-analyze__sublabel">ANALYSIS</span>
        </div>
        <div className="overview-analyze__logo">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.98166 17.1469C13.4912 17.1469 17.1469 13.4912 17.1469 8.98166C17.1469 4.47211 13.4912 0.816406 8.98166 0.816406C4.47211 0.816406 0.816406 4.47211 0.816406 8.98166C0.816406 13.4912 4.47211 17.1469 8.98166 17.1469Z" stroke="#13777C" strokeWidth="1.63305" />
            <path d="M14.8145 14.814L20.6468 20.6463" stroke="#13777C" strokeWidth="1.63305" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div className="overview-analyze__status">
        <div className="overview-analyze__status-left">
          <span className="overview-analyze__count">{analyzingCount}</span>
          <span className="overview-analyze__unit">queued</span>
        </div>
        <span className="overview-analyze__total">
          {analyzeCellId !== undefined ? `/ 셀 #${analyzeCellId}` : '/ 분석 중인 셀 없음'}
        </span>
      </div>
      <div className="overview-analyze__status-bar">
        <div className="overview-analyze__status-bar-fill" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="overview-analyze__progress">
        <span
          className={`overview-analyze__spinner${analyzingCount === 0 ? ' overview-analyze__spinner--paused' : ''}`}
        />
        <span className="overview-analyze__progress-text">
          {analyzingCount === 0 ? '분석 대기 중' : 'AI 추론 진행 중'}
        </span>
      </div>
      <div className="overview-analyze__footer">
        <span className="overview-analyze__footer-hint">YOLOv11-seg</span>
        <span className="overview-analyze__footer-batch">
          {analyzeBatchId !== undefined ? `Batch #${analyzeBatchId}` : '-'}
        </span>
      </div>
    </button>
  )
}

export { OverviewAnalyze }
