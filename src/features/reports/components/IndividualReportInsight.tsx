import { useIndividualReportDetailStore } from '../store/useIndividualReportDetailStore'
import './IndividualReportInsight.css'

/** AI 분석 소견 카드 — 507×345. 리포트 본문(detail.content)을 그대로 보여준다 */
function IndividualReportInsight() {
  const content = useIndividualReportDetailStore((s) => s.detail?.content ?? null)

  return (
    <div className="individual-report-insight">
      <div className="individual-report-insight__header">
        <span className="individual-report-insight__title">AI 분석 소견</span>
        <span className="individual-report-insight__badge">LLM 생성</span>
      </div>

      <span className="individual-report-insight__divider" />

      {content ? (
        <p className="individual-report-insight__body">{content}</p>
      ) : (
        <p className="individual-report-insight__empty">본문이 없습니다.</p>
      )}
    </div>
  )
}

export { IndividualReportInsight }
