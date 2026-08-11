import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalAnimation } from '@/shared/hooks/useModalAnimation'
import './ReportModal.css'

interface ReportModalProps {
  title?: string
  content: string | null
  open: boolean
  onClose: () => void
}

/** LLM이 생성한 리포트 본문을 전체 화면으로 보여주는 모달 — 카드에서 잘린
   내용을 확인할 수 있게 한다. 507×690 피그마 스펙 기준 */
function ReportModal({ title = 'REPORT', content, open, onClose }: ReportModalProps) {
  const { mounted, visible } = useModalAnimation(open)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!mounted) return null

  return createPortal(
    <div className="report-modal-overlay" data-visible={visible} onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal__header">
          <span className="report-modal__title">{title}</span>
          <div className="report-modal__header-right">
            <span className="report-modal__badge">LLM 생성</span>
            <button type="button" className="report-modal__close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <span className="report-modal__divider" />

        {content ? (
          <p className="report-modal__body">{content}</p>
        ) : (
          <p className="report-modal__empty">본문이 없습니다.</p>
        )}
      </div>
    </div>,
    document.body,
  )
}

export { ReportModal }
