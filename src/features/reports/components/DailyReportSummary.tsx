import { useDailyReportDetailStore } from '../store/useDailyReportDetailStore'
import './DailyReportSummary.css'

/** 일일 총평 카드 — 1400×289. 리포트 본문(detail.content)을 그대로 보여준다 */
function DailyReportSummary() {
  const content = useDailyReportDetailStore((s) => s.detail?.content ?? null)

  return (
    <div className="daily-report-summary">
      <div className="daily-report-summary__header">
        <span className="daily-report-summary__title">일일 총평</span>
        <span className="daily-report-summary__badge">LLM 생성</span>
      </div>

      <span className="daily-report-summary__divider" />

      {content ? (
        <p className="daily-report-summary__body">{content}</p>
      ) : (
        <p className="daily-report-summary__empty">본문이 없습니다.</p>
      )}
    </div>
  )
}

export { DailyReportSummary }
