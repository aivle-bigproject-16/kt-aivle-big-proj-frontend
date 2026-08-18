import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { asBlob } from 'html-docx-js-typescript'
import { saveAs } from 'file-saver'
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

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>REPORT - ${title}</title>
          <style>
            body {
              font-family: sans-serif;
              color: #191c1d;
              line-height: 1.6;
              padding: 20mm;
              margin: 0;
            }
            h1, h2, h3 {
              margin-top: 1.5em;
              margin-bottom: 0.5em;
              font-weight: 600;
              line-height: 1.25;
            }
            h1 { font-size: 2em; border-bottom: 1px solid #eceef0; padding-bottom: 0.3em; }
            h2 { font-size: 1.5em; border-bottom: 1px solid #eceef0; padding-bottom: 0.3em; }
            h3 { font-size: 1.25em; }
            p, blockquote, ul, ol, dl, table, pre, details {
              margin-top: 0;
              margin-bottom: 16px;
            }
            blockquote {
              padding: 0 1em;
              color: #6a737d;
              border-left: 0.25em solid #dfe2e5;
            }
            table {
              border-spacing: 0;
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              padding: 6px 13px;
              border: 1px solid #dfe2e5;
            }
            tr:nth-child(2n) {
              background-color: #f6f8fa;
            }
            code {
              padding: 0.2em 0.4em;
              margin: 0;
              font-size: 85%;
              background-color: rgba(27, 31, 35, 0.05);
              border-radius: 3px;
            }
            pre {
              background-color: #f6f8fa;
              padding: 16px;
              overflow: auto;
              border-radius: 3px;
            }
            pre > code {
              padding: 0;
              margin: 0;
              font-size: 100%;
              white-space: pre-wrap;
              background: transparent;
              border: 0;
            }
            @media print {
              @page { margin: 0; }
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
              h1, h2, h3 { page-break-after: avoid; }
              table, pre, img, blockquote { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${contentHtml}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 200);
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
      const htmlString = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${bodyRef.current.outerHTML}</body></html>`
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
