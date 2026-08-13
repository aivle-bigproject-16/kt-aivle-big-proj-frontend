import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/shared/ui/Modal'
import { ROUTES } from '@/core/navigation/routes'
import { useNoticeDetailStore } from '../store/useNoticeDetailStore'
import { useLoginStore } from '@/features/auth'
import { hasRole } from '@/shared/security/access'
import './NoticeDetailActions.css'

interface NoticeDetailActionsProps {
  id: number
}

/** 상세 화면 하단의 수정·삭제 버튼. 삭제는 되돌릴 수 없어 확인 창을 한 번 거친다 */
function NoticeDetailActions({ id }: NoticeDetailActionsProps) {
  const navigate = useNavigate()
  const { remove } = useNoticeDetailStore((s) => s.actions)
  const role = useLoginStore((s) => s.role)
  const isAdmin = hasRole(role, 'ADMIN')

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (isDeleting) return

    setIsDeleting(true)
    setError(null)
    try {
      await remove(id)
      navigate(ROUTES.NOTICE)
    } catch {
      // 실패하면 확인 창에 머물러 사유를 보여준다
      setError('삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      setIsDeleting(false)
    }
  }

  const closeConfirm = () => {
    if (isDeleting) return
    setIsConfirmOpen(false)
    setError(null)
  }

  if (!isAdmin) return null

  return (
    <>
      <div className="notice-detail-actions">
        <button
          type="button"
          className="notice-detail-actions__edit"
          onClick={() => navigate(ROUTES.NOTICE_EDIT(id))}
        >
          수정
        </button>
        <button
          type="button"
          className="notice-detail-actions__delete"
          onClick={() => setIsConfirmOpen(true)}
        >
          삭제
        </button>
      </div>

      <Modal open={isConfirmOpen} onClose={closeConfirm} className="notice-delete-confirm">
        <h2 className="notice-delete-confirm__title">공지사항을 삭제할까요?</h2>
        <p className="notice-delete-confirm__text">삭제한 공지사항은 되돌릴 수 없습니다.</p>

        {error && <p className="notice-delete-confirm__error">{error}</p>}

        <div className="notice-delete-confirm__actions">
          <button
            type="button"
            className="notice-delete-confirm__cancel"
            onClick={closeConfirm}
            disabled={isDeleting}
          >
            취소
          </button>
          <button
            type="button"
            className="notice-delete-confirm__submit"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </Modal>
    </>
  )
}

export { NoticeDetailActions }
