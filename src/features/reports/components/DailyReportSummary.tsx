import { useState } from 'react'
import { ReportModal } from '@/shared/ui/ReportModal'
import { useDailyReportDetailStore } from '../store/useDailyReportDetailStore'
import './DailyReportSummary.css'

/** 일일 총평 카드 — 1400×289. 리포트 본문(detail.content)을 그대로 보여준다.
   고정 높이라 길면 잘리므로, 클릭하면 전체 리포트를 모달로 펼쳐 보여준다 */
function DailyReportSummary() {
  const content = useDailyReportDetailStore((s) => s.detail?.content ?? null)
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className="daily-report-summary" onClick={() => setOpen(true)}>
        <div className="daily-report-summary__header">
          <span className="daily-report-summary__title">REPORT</span>
          <span className="daily-report-summary__badge">LLM 생성</span>
        </div>

        <span className="daily-report-summary__divider" />

        {content ? (
          <p className="daily-report-summary__body">{content}</p>
        ) : (
          <p className="daily-report-summary__empty">본문이 없습니다.</p>
        )}
      </button>

      <ReportModal title="REPORT" content={content} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export { DailyReportSummary }
