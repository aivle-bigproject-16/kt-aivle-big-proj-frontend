import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListBackNav } from '@/shared/ui/ListBackNav'
import { ROUTES } from '@/core/navigation/routes'
import { NoticeForm, type NoticeFormValues } from './NoticeForm'
import { useNoticeDetailStore } from '../store/useNoticeDetailStore'
import './NoticeEdit.css'

interface NoticeEditProps {
  id: number
}

/** 공지사항 수정 페이지 — 작성 화면과 같은 폼을 쓰되 기존 값을 채워서 보여준다 */
function NoticeEdit({ id }: NoticeEditProps) {
  const navigate = useNavigate()
  const detail = useNoticeDetailStore((s) => s.detail)
  const isLoading = useNoticeDetailStore((s) => s.isLoading)
  const error = useNoticeDetailStore((s) => s.error)
  const { fetchDetail, update, reset } = useNoticeDetailStore((s) => s.actions)

  useEffect(() => {
    fetchDetail(id)
    return () => reset()
  }, [fetchDetail, reset, id])

  const handleUpdate = async (values: NoticeFormValues) => {
    // 수정 응답은 data가 null이라 돌려받을 게 없다.
    // 상세로 이동하면 그 화면이 다시 조회하므로 최신 내용이 보인다.
    await update(id, values)
    navigate(ROUTES.NOTICE_DETAIL(id))
  }

  return (
    <div className="notice-edit">
      <ListBackNav to={ROUTES.NOTICE_DETAIL(id)} label="공지사항으로" />
      <h1 className="notice-edit__title">공지사항 수정</h1>

      {error ? (
        <div className="notice-edit__notice notice-edit__notice--error">{error}</div>
      ) : isLoading || !detail ? (
        <div className="notice-edit__notice">불러오는 중...</div>
      ) : (
        <NoticeForm
          initialValues={{ title: detail.title, content: detail.content }}
          submitLabel="수정"
          onSubmit={handleUpdate}
          cancelTo={ROUTES.NOTICE_DETAIL(id)}
        />
      )}
    </div>
  )
}

export { NoticeEdit }
