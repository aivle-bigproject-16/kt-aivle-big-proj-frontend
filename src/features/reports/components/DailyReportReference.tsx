import { useDailyReportDetailStore } from '../store/useDailyReportDetailStore'
import './DailyReportReference.css'

/** 참조 이미지 카드 — 507×367. CT 우선, 없으면 RGB 이미지를 보여준다 */
function DailyReportReference() {
  const detail = useDailyReportDetailStore((s) => s.detail)
  const imageUrl = detail?.ctImageUrl ?? detail?.rgbImageUrl ?? null
  const imageType = detail?.ctImageUrl ? 'CT' : 'RGB'

  return (
    <div className="daily-report-reference">
      <div className="daily-report-reference__header">
        <span className="daily-report-reference__title">참조 이미지</span>
        <span className="daily-report-reference__subtitle">REFERENCE</span>
      </div>

      {imageUrl ? (
        <>
          <div className="daily-report-reference__image">
            <img src={imageUrl} alt={`${imageType} 참조 이미지`} className="daily-report-reference__img" />
            <span className="daily-report-reference__badge">{imageType}</span>
          </div>
          <span className="daily-report-reference__caption">{imageType} · 참조 이미지</span>
        </>
      ) : (
        <p className="daily-report-reference__empty">참조 이미지가 없습니다.</p>
      )}
    </div>
  )
}

export { DailyReportReference }
