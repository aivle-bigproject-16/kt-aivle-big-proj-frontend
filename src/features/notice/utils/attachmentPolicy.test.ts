import { describe, expect, it } from 'vitest'
import { NOTICE_ATTACHMENT_MAX_BYTES, validateNoticeAttachment } from './attachmentPolicy'

describe('notice attachment policy', () => {
  it.each(['guide.pdf', 'image.png', 'photo.jpg', 'photo.JPEG', 'template.docx'])(
    'accepts %s',
    (name) => {
      expect(validateNoticeAttachment(new File(['ok'], name))).toBeNull()
    },
  )

  it.each(['script.exe', 'legacy.doc', 'typo.docs', 'archive.zip'])(
    'rejects %s',
    (name) => {
      expect(validateNoticeAttachment(new File(['no'], name))).toContain('DOCX')
    },
  )

  it('rejects files larger than 5MB', () => {
    const file = new File([new Uint8Array(NOTICE_ATTACHMENT_MAX_BYTES + 1)], 'large.pdf')
    expect(validateNoticeAttachment(file)).toContain('5MB')
  })
})
