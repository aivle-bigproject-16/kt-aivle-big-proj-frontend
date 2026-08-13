import { describe, expect, it } from 'vitest'
import { buildNoticeFormData } from './noticeService'

function readBlob(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

describe('buildNoticeFormData', () => {
  it('sends JSON in request and the binary in file', async () => {
    const file = new File(['document'], 'guide.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    const formData = buildNoticeFormData({
      request: { title: '제목', content: '내용', deleteFile: true },
      file,
    })

    const requestPart = formData.get('request')
    expect(requestPart).toBeInstanceOf(Blob)
    expect((requestPart as Blob).type).toBe('application/json')
    expect(JSON.parse(await readBlob(requestPart as Blob))).toEqual({
      title: '제목',
      content: '내용',
      deleteFile: true,
    })
    expect(formData.get('file')).toBe(file)
  })

  it('omits the file part when no file was selected', () => {
    const formData = buildNoticeFormData({ request: { title: '제목', content: '내용' } })
    expect(formData.has('file')).toBe(false)
  })
})
