import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import './NoticeForm.css'

const TITLE_MAX_LENGTH = 255

interface NoticeFormValues {
  title: string
  content: string
}

interface NoticeFormProps {
  /** 수정 화면에서 기존 값을 채워 넣을 때 쓴다. 작성 화면은 비워 둔다 */
  initialValues?: NoticeFormValues
  submitLabel: string
  /** 저장에 실패하면 반드시 예외를 던져야 폼에 그대로 머문다 */
  onSubmit: (values: NoticeFormValues) => Promise<void>
  cancelTo: string
}

function NoticeForm({ initialValues, submitLabel, onSubmit, cancelTo }: NoticeFormProps) {
  const navigate = useNavigate()

  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [content, setContent] = useState(initialValues?.content ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFilled = title.trim() !== '' && content.trim() !== ''

  const handleSubmit = async (e: FormEvent) => {
    // 폼은 기본 동작이 "페이지 새로고침"이라 반드시 막아야 한다
    e.preventDefault()
    if (!isFilled || isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit({ title: title.trim(), content: content.trim() })
    } catch {
      // 실패하면 화면을 옮기지 않고 폼에 머문다 — 입력한 내용이 날아가면 안 되기 때문이다
      setError('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      setIsSubmitting(false)
    }
  }

  return (
    <form className="notice-form" onSubmit={handleSubmit}>
      <label className="notice-form__field">
        <span className="notice-form__label">제목</span>
        <input
          type="text"
          className="notice-form__input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX_LENGTH}
          placeholder="공지 제목을 입력하세요"
          disabled={isSubmitting}
        />
        <span className="notice-form__counter">
          {title.length} / {TITLE_MAX_LENGTH}
        </span>
      </label>

      <label className="notice-form__field notice-form__field--grow">
        <span className="notice-form__label">내용</span>
        <textarea
          className="notice-form__textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="공지 내용을 입력하세요"
          disabled={isSubmitting}
        />
      </label>

      {error && <p className="notice-form__error">{error}</p>}

      <div className="notice-form__actions">
        <button
          type="button"
          className="notice-form__cancel"
          onClick={() => navigate(cancelTo)}
          disabled={isSubmitting}
        >
          취소
        </button>
        <button type="submit" className="notice-form__submit" disabled={!isFilled || isSubmitting}>
          {isSubmitting ? '저장 중...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export { NoticeForm }
export type { NoticeFormValues }
