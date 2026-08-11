import { useSimulationStore } from '../store/useSimulationStore'
import './OverviewCapture.css'

/* 프로그레스 세그먼트 개수 — 색은 CSS 애니메이션이 좌→우로 순차 재생하며 만든다 */
const PROGRESS_SEGMENT_COUNT = 12

/** 오버뷰 카드 — 420×230 흰 카드. 내부는 5개 영역이 세로로 정렬된다:
   헤더 / 스테이터스 / 스테이터스 바 / progress / 푸터 */
function OverviewCapture({ onClick }: { onClick?: () => void }) {
  /* 현재 촬영(CAPTURING) 중인 셀 개수 */
  const capturingCount = useSimulationStore(
    (s) => s.capture.filter((c) => c.status === 'CAPTURING').length,
  )
  const totalCount = useSimulationStore((s) => s.batteryCellCount)

  /* capture 배열 안에서 지금 CAPTURED 상태인 셀 개수 */
  const capturedInCaptureArray = useSimulationStore(
    (s) => s.capture.filter((c) => c.status === 'CAPTURED').length,
  )
  /* 클램프 — WS 메시지 순서가 꼬이면 값이 totalCount를 순간적으로 넘어설 수 있는데,
     그대로 두면 fill이 상태바 길이를 벗어난다 */
  const ratio = totalCount > 0 ? Math.min(1, capturedInCaptureArray / totalCount) : 0

  const captureSpeed = useSimulationStore((s) => s.captureSpeed)
  /* 현재 촬영(CAPTURING) 중인 배치 — capture 배열에서 CAPTURING 상태 셀의 배치 id */
  const capturingBatchId = useSimulationStore(
    (s) => s.capture.find((c) => c.status === 'CAPTURING')?.batchId,
  )

  return (
    <button type="button" className="overview-capture" onClick={onClick}>
      <div className="overview-capture__header">
        <div className="overview-capture__header-left">
          <span className="overview-capture__dot" />
          <span className="overview-capture__label">촬영</span>
          <span className="overview-capture__sublabel">CAPTURING</span>
        </div>
        <div className="overview-capture__logo">
          <svg width="26" height="20" viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.0164 0.816406H5.61641C2.96544 0.816406 0.816406 2.96544 0.816406 5.61641V14.0164C0.816406 16.6674 2.96544 18.8164 5.61641 18.8164H20.0164C22.6674 18.8164 24.8164 16.6674 24.8164 14.0164V5.61641C24.8164 2.96544 22.6674 0.816406 20.0164 0.816406Z" stroke="#13777C" strokeWidth="1.63305" />
            <path d="M12.8166 14.6161C15.4676 14.6161 17.6166 12.4671 17.6166 9.81611C17.6166 7.16515 15.4676 5.01611 12.8166 5.01611C10.1656 5.01611 8.0166 7.16515 8.0166 9.81611C8.0166 12.4671 10.1656 14.6161 12.8166 14.6161Z" stroke="#13777C" strokeWidth="1.63305" />
          </svg>
        </div>
      </div>
      <div className="overview-capture__status">
        <div className="overview-capture__status-left">
          <span className="overview-capture__count">{capturingCount}</span>
          <span className="overview-capture__unit">active</span>
        </div>
        <span className="overview-capture__total">/ {capturedInCaptureArray} captured</span>
      </div>
      <div className="overview-capture__status-bar">
        <div className="overview-capture__status-bar-fill" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="overview-capture__progress">
        {Array.from({ length: PROGRESS_SEGMENT_COUNT }, (_, i) => (
          <span
            key={i}
            className={`overview-capture__progress-segment${capturingCount === 0 ? ' overview-capture__progress-segment--idle' : ''}`}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <div className="overview-capture__footer">
        <span className="overview-capture__footer-hint">
          촬영 속도 {captureSpeed !== null ? captureSpeed.toFixed(1) : '-'}s / 배치
        </span>
        <span className="overview-capture__footer-batch">
          {capturingBatchId !== undefined ? `Batch #${capturingBatchId}` : '촬영 중인 배치 없음'}
        </span>
      </div>
    </button>
  )
}

export { OverviewCapture }
