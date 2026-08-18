import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { asBlob } from 'html-docx-js-typescript'
import { saveAs } from 'file-saver'
import { useModalAnimation } from '@/shared/hooks/useModalAnimation'
import './ReportModal.css'
import './markdown.css'
// 화면에 먹이는 것과 같은 파일을 문자열로도 읽어 인쇄 창·DOCX 에 심는다
import markdownCss from './markdown.css?raw'

/* 인쇄 창·DOCX 에 함께 실어 보내는 문서용 스타일.
   본문 규칙은 markdown.css 하나에서 오고, 여기에는 종이에만 필요한 것만 더한다. */
const documentCss = `
  ${markdownCss}
  body { margin: 0; padding: 20mm; font-family: sans-serif; }
  @media print {
    @page { margin: 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .markdown-body h1,
    .markdown-body h2,
    .markdown-body h3 { page-break-after: avoid; }
    .markdown-body table,
    .markdown-body pre,
    .markdown-body img,
    .markdown-body blockquote { page-break-inside: avoid; }
  }
`

/** 인쇄 창 <title> 로 나가는 값이라 태그로 읽히지 않게 막는다 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

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
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleDownloadPdf = () => {
    if (!bodyRef.current) return
    const contentHtml = bodyRef.current.innerHTML

    const printWindow = window.open('', '_blank', 'width=800,height=800')
    if (!printWindow) {
      alert('팝업 차단을 해제해주세요.')
      return
    }

    /* 인쇄가 끝난 뒤에 창을 닫는다. print() 가 블로킹인 브라우저는 onafterprint 로,
       비동기인 브라우저는 print 미디어가 풀리는 순간으로 잡는다. 고정 지연으로 닫으면
       대화상자가 뜨기도 전에 창이 사라지는 브라우저가 있다. */
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="utf-8" />
          <title>REPORT - ${escapeHtml(title)}</title>
          <style>${documentCss}</style>
        </head>
        <body>
          <div class="markdown-body">${contentHtml}</div>
          <script>
            window.onload = () => {
              const close = () => window.close()
              window.addEventListener('afterprint', close)
              const printMedia = window.matchMedia && window.matchMedia('print')
              if (printMedia) {
                printMedia.addEventListener('change', (e) => {
                  if (!e.matches) close()
                })
              }
              window.print()
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownloadDocx = async () => {
    if (!bodyRef.current) return
    try {
      /* Word 는 클래스 선택자를 해석하므로 스타일시트를 함께 넣어야 표 테두리와
         제목 크기가 살아남는다. 넣지 않으면 서식 없는 문서가 나온다. */
      const htmlString = `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${documentCss}</style></head><body>${bodyRef.current.outerHTML}</body></html>`
      const blob = await asBlob(htmlString)
      saveAs(blob as Blob, 'report.docx')
    } catch (err) {
      console.error('DOCX 다운로드 실패', err)
      alert('DOCX 다운로드 중 오류가 발생했습니다.')
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="report-modal-overlay" data-visible={visible} onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal__header">
          <span className="report-modal__title">{title}</span>
          <div className="report-modal__header-right">
            {content && (
              <>
                <button type="button" className="report-modal__btn" onClick={handleDownloadPdf}>
                  PDF
                </button>
                <button type="button" className="report-modal__btn" onClick={handleDownloadDocx}>
                  DOCX
                </button>
              </>
            )}
            <span className="report-modal__badge">LLM 생성</span>
            <button type="button" className="report-modal__close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <span className="report-modal__divider" />

        {content ? (
          <div className="report-modal__body markdown-body" ref={bodyRef}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="report-modal__empty">본문이 없습니다.</p>
        )}
      </div>
    </div>,
    document.body,
  )
}

export { ReportModal }
