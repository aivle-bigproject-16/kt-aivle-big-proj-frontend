import { describe, expect, it } from 'vitest'
import { buildNoticeFormData } from './noticeService'

describe('buildNoticeFormData', () => {
  it('sends each field separately with the binary in file', () => {
    const file = new File(['document'], 'guide.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    const formData = buildNoticeFormData({
      request: { title: '제목', content: '내용', deleteFile: true },
      file,
    })

    expect(formData.has('request')).toBe(false)
    expect(formData.get('title')).toBe('제목')
    expect(formData.get('content')).toBe('내용')
    expect(formData.get('deleteFile')).toBe('true')
    expect(formData.get('file')).toBe(file)
  })

  it('omits optional parts when no file or deletion was requested', () => {
    const formData = buildNoticeFormData({ request: { title: '제목', content: '내용' } })
    expect(formData.has('file')).toBe(false)
    expect(formData.has('deleteFile')).toBe(false)
  })
})
