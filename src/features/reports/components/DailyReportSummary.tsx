import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ReportModal } from '@/shared/ui/ReportModal'
import { useDailyReportDetailStore } from '../store/useDailyReportDetailStore'
import './DailyReportSummary.css'
import '@/shared/ui/markdown.css'

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
          <div className="daily-report-summary__body markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="daily-report-summary__empty">본문이 없습니다.</p>
        )}
      </button>

      <ReportModal title="REPORT" content={content} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export { DailyReportSummary }
