import { useDailyReportDetailStore } from '../store/useDailyReportDetailStore'
import './DailyReportPageHeader.css'

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

/** 일일 리포트 헤더 — 1400×97 흰 카드, 곡률 1.21rem.
   왼쪽: 날짜 배지 + 상태 텍스트 + 타이틀(수율 포함), 오른쪽: 생성일시/수정일시 */
function DailyReportPageHeader() {
  const detail = useDailyReportDetailStore((s) => s.detail)
  const { totalCount, rejectCount } = detail?.summary ?? { totalCount: 0, rejectCount: 0 }
  const passRate = totalCount > 0 ? ((totalCount - rejectCount) / totalCount) * 100 : 0

  return (
    <div className="daily-report-header">
      <div className="daily-report-header__left">
        <div className="daily-report-header__badge-row">
          <span className="daily-report-header__badge">{detail?.reportDate ?? '-'}</span>
          <span className="daily-report-header__status">
            {detail ? (STATUS_TEXT[detail.status] ?? detail.status) : '-'}
          </span>
        </div>
        <h1 className="daily-report-header__title">
          {detail
            ? `${detail.reportDate} 일일 검사 요약 — 수율 ${passRate.toFixed(1)}%`
            : '일일 검사 요약'}
        </h1>
      </div>

      <div className="daily-report-header__meta">
        <span className="daily-report-header__meta-item">
          <span className="daily-report-header__meta-label">생성일시</span>
          <span className="daily-report-header__meta-value">
            {formatDateTime(detail?.createdAt ?? null)}
          </span>
        </span>
        <span className="daily-report-header__meta-item">
          <span className="daily-report-header__meta-label">수정일시</span>
          <span className="daily-report-header__meta-value">
            {formatDateTime(detail?.updatedAt ?? null)}
          </span>
        </span>
      </div>
    </div>
  )
}

export { DailyReportPageHeader }
