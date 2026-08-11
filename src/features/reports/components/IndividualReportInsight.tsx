import { useState } from 'react'
import { ReportModal } from '@/shared/ui/ReportModal'
import { useIndividualReportDetailStore } from '../store/useIndividualReportDetailStore'
import './IndividualReportInsight.css'

/** AI 분석 소견 카드 — 507×345. 리포트 본문(detail.content)을 그대로 보여준다.
   카드 안에서는 스크롤로 잘려 보이므로, 클릭하면 전체 리포트를 모달로 펼쳐 보여준다 */
function IndividualReportInsight() {
  const content = useIndividualReportDetailStore((s) => s.detail?.content ?? null)
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="individual-report-insight"
        onClick={() => setOpen(true)}
      >
        <div className="individual-report-insight__header">
          <span className="individual-report-insight__title">REPORT</span>
          <span className="individual-report-insight__badge">LLM 생성</span>
        </div>

        <span className="individual-report-insight__divider" />

        {content ? (
          <p className="individual-report-insight__body">{content}</p>
        ) : (
          <p className="individual-report-insight__empty">본문이 없습니다.</p>
        )}
      </button>

      <ReportModal
        title="REPORT"
        content={content}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

export { IndividualReportInsight }
