import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalAnimation } from '@/shared/hooks/useModalAnimation'
import './ImageBboxModal.css'

export interface ImageBboxRegion {
  id: string | number
  bbox: { x: number; y: number; width: number; height: number }
  tone?: 'reject' | 'fail' | 'pass' | 'neutral'
  label?: string | number
}

export interface ImageBboxInfoItem {
  id: string | number
  badgeText?: string
  badgeTone?: 'reject' | 'fail' | 'pass' | 'neutral'
  primaryText: string
  secondaryText?: string
}

interface ImageBboxModalProps {
  title: string
  imageUrl: string
  regions: ImageBboxRegion[]
  infoItems?: ImageBboxInfoItem[]
  open: boolean
  onClose: () => void
}

function ImageBboxModal({ title, imageUrl, regions, infoItems, open, onClose }: ImageBboxModalProps) {
  const { mounted, visible } = useModalAnimation(open)
  const imgRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

  // 윈도우 리사이즈 등에 대응하기 위해 ResizeObserver 사용
  useEffect(() => {
    if (!mounted || !open) return
    const img = imgRef.current
    if (!img) return

    const updateScale = () => {
      if (!img.naturalWidth) return
      const nw = img.naturalWidth
      const nh = img.naturalHeight
      const dw = img.clientWidth
      const dh = img.clientHeight
      const s = Math.min(dw / nw, dh / nh)
      setScale({ sx: s, sy: s, ox: (dw - nw * s) / 2, oy: (dh - nh * s) / 2 })
    }

    const observer = new ResizeObserver(updateScale)
    observer.observe(img)
    img.addEventListener('load', updateScale)

    return () => {
      observer.disconnect()
      img.removeEventListener('load', updateScale)
    }
  }, [mounted, open, imageUrl])

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
    <div className="image-bbox-modal-overlay" data-visible={visible} onClick={onClose}>
      <div className="image-bbox-modal" onClick={(e) => e.stopPropagation()}>
        <div className="image-bbox-modal__header">
          <span className="image-bbox-modal__title">{title}</span>
          <button type="button" className="image-bbox-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="image-bbox-modal__body">
          <div className="image-bbox-modal__img-container">
            <img ref={imgRef} src={imageUrl} alt={title} className="image-bbox-modal__img" />
            {scale &&
              regions.map((r) => (
                <span
                  key={r.id}
                  className={`image-bbox-modal__marker image-bbox-modal__marker--${r.tone ?? 'neutral'}`}
                  style={{
                    left: scale.ox + r.bbox.x * scale.sx,
                    top: scale.oy + r.bbox.y * scale.sy,
                    width: r.bbox.width * scale.sx,
                    height: r.bbox.height * scale.sy,
                  }}
                >
                  {r.label && <span className="image-bbox-modal__marker-label">{r.label}</span>}
                </span>
              ))}
          </div>
        </div>

        {infoItems && infoItems.length > 0 && (
          <ul className="image-bbox-modal__info-list">
            {infoItems.map((item) => (
              <li key={item.id} className="image-bbox-modal__info-item">
                {item.badgeText && (
                  <span
                    className={`image-bbox-modal__badge image-bbox-modal__badge--${item.badgeTone ?? 'neutral'}`}
                  >
                    {item.badgeText}
                  </span>
                )}
                <span className="image-bbox-modal__primary">{item.primaryText}</span>
                {item.secondaryText && (
                  <span className="image-bbox-modal__secondary">{item.secondaryText}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  )
}

export { ImageBboxModal }
