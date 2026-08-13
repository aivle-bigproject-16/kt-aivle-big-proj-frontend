import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  formatFileSize,
  NOTICE_ATTACHMENT_ACCEPT,
  validateNoticeAttachment,
} from '../utils/attachmentPolicy'
import './NoticeForm.css'

const TITLE_MAX_LENGTH = 255

interface NoticeFormValues {
  title: string
  content: string
  file: File | null
  deleteFile: boolean
}

interface InitialAttachment {
  fileUrl: string
  originalFileName: string
}

interface NoticeFormProps {
  /** 수정 화면에서 기존 값을 채워 넣을 때 쓴다. 작성 화면은 비워 둔다 */
  initialValues?: Pick<NoticeFormValues, 'title' | 'content'>
  initialAttachment?: InitialAttachment
  submitLabel: string
  /** 저장에 실패하면 반드시 예외를 던져야 폼에 그대로 머문다 */
  onSubmit: (values: NoticeFormValues) => Promise<void>
  cancelTo: string
}

function NoticeForm({ initialValues, initialAttachment, submitLabel, onSubmit, cancelTo }: NoticeFormProps) {
  const navigate = useNavigate()

  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [content, setContent] = useState(initialValues?.content ?? '')
  const [activeTab, setActiveTab] = useState<'content' | 'attachment'>('content')
  const [file, setFile] = useState<File | null>(null)
  const [deleteFile, setDeleteFile] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFilled = title.trim() !== '' && content.trim() !== ''

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isFilled || isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit({ title: title.trim(), content: content.trim(), file, deleteFile })
    } catch {
      setError('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0]
    event.target.value = ''
    if (!nextFile) return

    const validationError = validateNoticeAttachment(nextFile)
    if (validationError) {
      setFileError(validationError)
      return
    }

    setFile(nextFile)
    setDeleteFile(false)
    setFileError(null)
  }

  const removeAttachment = () => {
    if (file) {
      setFile(null)
      return
    }
    if (initialAttachment) setDeleteFile(true)
  }

  const visibleAttachment = file
    ? { name: file.name, meta: formatFileSize(file.size), url: null }
    : initialAttachment && !deleteFile
      ? { name: initialAttachment.originalFileName, meta: '기존 첨부파일', url: initialAttachment.fileUrl }
      : null

  return (
    <form className="notice-form" onSubmit={handleSubmit}>
      <label className="notice-form__field">
        <span className="notice-form__label">제목</span>
        <input
          type="text"
          className="notice-form__input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={TITLE_MAX_LENGTH}
          placeholder="공지 제목을 입력하세요"
          disabled={isSubmitting}
        />
        <span className="notice-form__counter">{title.length} / {TITLE_MAX_LENGTH}</span>
      </label>

      <div className="notice-form__tabs" role="tablist" aria-label="공지 작성 항목">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'content'}
          className="notice-form__tab"
          onClick={() => setActiveTab('content')}
        >
          내용
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'attachment'}
          className="notice-form__tab"
          onClick={() => setActiveTab('attachment')}
        >
          첨부파일
        </button>
      </div>

      {activeTab === 'content' ? (
        <label className="notice-form__field notice-form__field--grow" role="tabpanel">
          <span className="notice-form__label">내용</span>
          <textarea
            className="notice-form__textarea"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="공지 내용을 입력하세요"
            disabled={isSubmitting}
          />
        </label>
      ) : (
        <section className="notice-form__attachment-panel" role="tabpanel">
          <div className="notice-form__upload-copy">
            <strong>파일 첨부</strong>
            <span>PDF, PNG, JPG, JPEG, DOCX · 최대 5MB · 1개</span>
          </div>

          {visibleAttachment ? (
            <div className="notice-form__file-row">
              <div>
                {visibleAttachment.url ? (
                  <a href={visibleAttachment.url} target="_blank" rel="noreferrer">{visibleAttachment.name}</a>
                ) : (
                  <strong>{visibleAttachment.name}</strong>
                )}
                <span>{visibleAttachment.meta}</span>
              </div>
              <button type="button" onClick={removeAttachment} disabled={isSubmitting}>삭제</button>
            </div>
          ) : (
            <label className="notice-form__upload-button">
              파일 선택
              <input
                type="file"
                accept={NOTICE_ATTACHMENT_ACCEPT}
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
            </label>
          )}

          {deleteFile && initialAttachment && (
            <button
              type="button"
              className="notice-form__restore"
              onClick={() => {
                setDeleteFile(false)
                setFileError(null)
              }}
            >
              기존 파일 삭제 취소
            </button>
          )}
          {visibleAttachment && (
            <label className="notice-form__replace-button">
              다른 파일로 교체
              <input
                type="file"
                accept={NOTICE_ATTACHMENT_ACCEPT}
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
            </label>
          )}
          {fileError && <p className="notice-form__error">{fileError}</p>}
        </section>
      )}

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
