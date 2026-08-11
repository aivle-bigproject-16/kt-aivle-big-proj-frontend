import { useNavigate } from 'react-router-dom'
import { ListBackNav } from '@/shared/ui/ListBackNav'
import { ROUTES } from '@/core/navigation/routes'
import { NoticeForm, type NoticeFormValues } from './NoticeForm'
import { useNoticeDetailStore } from '../store/useNoticeDetailStore'
import './NoticeCreate.css'

/** 공지사항 작성 페이지 — 목록 버튼 + 제목/본문 폼 */
function NoticeCreate() {
  const navigate = useNavigate()
  const { create } = useNoticeDetailStore((s) => s.actions)

  const handleCreate = async (values: NoticeFormValues) => {
    // 저장이 끝나면 방금 만든 글의 상세 페이지로 이동한다.
    // create가 새 글의 id를 돌려주기 때문에 가능하다.
    const newId = await create(values)
    navigate(ROUTES.NOTICE_DETAIL(newId))
  }

  return (
    <div className="notice-create">
      <ListBackNav to={ROUTES.NOTICE} label="공지사항 목록" />
      <h1 className="notice-create__title">공지사항 작성</h1>
      <NoticeForm submitLabel="등록" onSubmit={handleCreate} cancelTo={ROUTES.NOTICE} />
    </div>
  )
}

export { NoticeCreate }
