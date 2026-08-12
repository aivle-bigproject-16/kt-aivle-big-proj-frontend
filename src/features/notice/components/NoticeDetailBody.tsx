import { useNoticeDetailStore } from '../store/useNoticeDetailStore'
import './NoticeDetailBody.css'

/** 공지사항 본문 — 1400×400 흰 카드. 내용이 길면 카드 안에서 스크롤된다 */
function NoticeDetailBody() {
  const detail = useNoticeDetailStore((s) => s.detail)

  return (
    <div className="notice-detail-body">
      <span className="notice-detail-body__title">내용</span>
      <p className="notice-detail-body__content">{detail?.content ?? ''}</p>
    </div>
  )
}

export { NoticeDetailBody }
