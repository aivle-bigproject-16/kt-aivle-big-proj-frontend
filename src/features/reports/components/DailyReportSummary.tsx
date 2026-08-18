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
      <div className="daily-report-summary">
        <div className="daily-report-summary__header">
          <span className="daily-report-summary__title">REPORT</span>
          <span className="daily-report-summary__badge">LLM 생성</span>
          <div className="daily-report-summary__header-spacer" style={{ flexGrow: 1 }} />
          <button 
            type="button" 
            className="daily-report-summary__download-btn"
            onClick={() => setOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1.6rem', height: '1.6rem', marginRight: '0.4rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            다운로드
          </button>
        </div>

        <span className="daily-report-summary__divider" />

        {content ? (
          <div className="daily-report-summary__body markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="daily-report-summary__empty">본문이 없습니다.</p>
        )}
      </div>

      <ReportModal title="REPORT" content={content} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export { DailyReportSummary }
