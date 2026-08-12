import { useEffect } from 'react'
import { ListBackNav } from '@/shared/ui/ListBackNav'
import { ROUTES } from '@/core/navigation/routes'
import { NoticeDetailHeader } from './NoticeDetailHeader'
import { NoticeDetailBody } from './NoticeDetailBody'
import { NoticeDetailActions } from './NoticeDetailActions'
import { NoticeStateMessage } from './NoticeStateMessage'
import { useNoticeDetailStore } from '../store/useNoticeDetailStore'
import './NoticeDetail.css'

interface NoticeDetailProps {
  id: number
}

/** 공지사항 상세 페이지 전체 — 최상단에 목록 버튼, 그 아래 헤더/본문이
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
      <ListBackNav to={ROUTES.NOTICE} label="공지사항 목록" />

      {error ? (
        <NoticeStateMessage isError>{error}</NoticeStateMessage>
      ) : isLoading ? (
        <NoticeStateMessage>불러오는 중...</NoticeStateMessage>
      ) : (
        <>
          <NoticeDetailHeader />
          <NoticeDetailBody />
          <NoticeDetailActions id={id} />
        </>
      )}
    </div>
  )
}

export { NoticeDetail }
