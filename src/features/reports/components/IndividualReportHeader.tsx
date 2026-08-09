import { useIndividualReportDetailStore } from '../store/useIndividualReportDetailStore'
import './IndividualReportHeader.css'

const STATUS_TEXT: Record<string, string> = {
  PENDING: '생성 중',
  COMPLETED: 'COMPLETED',
  FAILED: '생성 실패',
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 개별 리포트 헤더 — 1400×100 흰 카드, 곡률 1.25rem.
   왼쪽: 셀 ID 배지 + 상태 텍스트 + 타이틀, 오른쪽: 생성일시/수정일시 */
function IndividualReportHeader() {
  const detail = useIndividualReportDetailStore((s) => s.detail)

  return (
    <div className="individual-report-header">
      <div className="individual-report-header__left">
        <div className="individual-report-header__badge-row">
          <span className="individual-report-header__badge">{detail?.cellSerialNo ?? '-'}</span>
          <span className="individual-report-header__status">
            {detail ? (STATUS_TEXT[detail.status] ?? detail.status) : '-'}
          </span>
        </div>
        <h1 className="individual-report-header__title">{detail?.title ?? 'CELL 미세결함'}</h1>
      </div>

      <div className="individual-report-header__meta">
        <span className="individual-report-header__meta-item">
          <span className="individual-report-header__meta-label">생성일시</span>
          <span className="individual-report-header__meta-value">
            {formatDateTime(detail?.createdAt ?? null)}
          </span>
        </span>
        <span className="individual-report-header__meta-item">
          <span className="individual-report-header__meta-label">수정일시</span>
          <span className="individual-report-header__meta-value">
            {formatDateTime(detail?.updatedAt ?? null)}
          </span>
        </span>
      </div>
    </div>
  )
}

export { IndividualReportHeader }
