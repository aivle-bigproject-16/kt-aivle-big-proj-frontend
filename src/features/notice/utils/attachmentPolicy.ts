export const NOTICE_ATTACHMENT_ACCEPT = '.pdf,.png,.jpg,.jpeg,.docx'
export const NOTICE_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024

const ALLOWED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'docx'])

export function validateNoticeAttachment(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
    return 'PDF, PNG, JPG, JPEG, DOCX 파일만 첨부할 수 있습니다.'
  }
  if (file.size > NOTICE_ATTACHMENT_MAX_BYTES) {
    return '첨부파일은 5MB 이하만 등록할 수 있습니다.'
  }
  return null
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
