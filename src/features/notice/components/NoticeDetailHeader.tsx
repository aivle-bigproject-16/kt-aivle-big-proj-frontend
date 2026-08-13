import { useNoticeDetailStore } from '../store/useNoticeDetailStore'
import { maskEmail, maskName } from '@/shared/security/masking'
import './NoticeDetailHeader.css'

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 공지사항 헤더 — 1400×100 흰 카드.
   왼쪽: 작성자 배지 + 제목, 오른쪽: 작성일시/수정일시 */
function NoticeDetailHeader() {
  const detail = useNoticeDetailStore((s) => s.detail)

  // 작성 후 한 번도 수정하지 않았다면 수정일시를 따로 보여줄 필요가 없다
  const isEdited = detail != null && detail.updatedAt !== detail.createdAt

  return (
    <div className="notice-detail-header">
      <div className="notice-detail-header__left">
        <div className="notice-detail-header__badge-row">
          <span className="notice-detail-header__badge">{detail ? maskName(detail.authorName) : '-'}</span>
          <span className="notice-detail-header__email">{detail ? maskEmail(detail.authorEmail) : ''}</span>
        </div>
        <h1 className="notice-detail-header__title">{detail?.title ?? ''}</h1>
      </div>

      <div className="notice-detail-header__meta">
        <span className="notice-detail-header__meta-item">
          <span className="notice-detail-header__meta-label">작성일시</span>
          <span className="notice-detail-header__meta-value">
            {formatDateTime(detail?.createdAt ?? null)}
          </span>
        </span>
        {isEdited && (
          <span className="notice-detail-header__meta-item">
            <span className="notice-detail-header__meta-label">수정일시</span>
            <span className="notice-detail-header__meta-value">
              {formatDateTime(detail.updatedAt)}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}

export { NoticeDetailHeader }
