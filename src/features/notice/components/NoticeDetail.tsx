import { useEffect } from 'react'
import { NoticeListNav } from './NoticeListNav'
import { NoticeDetailHeader } from './NoticeDetailHeader'
import { NoticeDetailBody } from './NoticeDetailBody'
import { useNoticeDetailStore } from '../store/useNoticeDetailStore'
import './NoticeDetail.css'

interface NoticeDetailProps {
  id: number
}

/** 공지사항 상세 페이지 전체 — 최상단에 NoticeListNav, 그 아래 헤더/본문이
   세로로 정렬된다 (1400×100 / 1400×400, 사이 갭 2rem) */
function NoticeDetail({ id }: NoticeDetailProps) {
  const isLoading = useNoticeDetailStore((s) => s.isLoading)
  const error = useNoticeDetailStore((s) => s.error)
  const { fetchDetail, reset } = useNoticeDetailStore((s) => s.actions)

  useEffect(() => {
    fetchDetail(id)
    // 다른 공지로 이동할 때 이전 글이 잠깐 보이는 것을 막는다
    return () => reset()
  }, [fetchDetail, reset, id])

  return (
    <div className="notice-detail">
      <NoticeListNav />

      {error ? (
        <div className="notice-detail__notice notice-detail__notice--error">{error}</div>
      ) : isLoading ? (
        <div className="notice-detail__notice">불러오는 중...</div>
      ) : (
        <>
          <NoticeDetailHeader />
          <NoticeDetailBody />
        </>
      )}
    </div>
  )
}

export { NoticeDetail }
