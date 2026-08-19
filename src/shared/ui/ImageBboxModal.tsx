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

interface Fit {
  /** 회전 전 이미지 자체 크기(자연 비율 유지) — 회전 안 하면 그대로가 최종 표시 크기 */
  w: number
  h: number
  rotated: boolean
  scale: number
}

function ImageBboxModal({ title, imageUrl, regions, infoItems, open, onClose }: ImageBboxModalProps) {
  const { mounted, visible } = useModalAnimation(open)
  const imgRef = useRef<HTMLImageElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState<Fit | null>(null)

  /* 긴 쪽이 항상 가로가 되도록, 세로로 긴(portrait) 원본이면 90도 돌린다. 모달은
     고정 크기가 아니라 뷰포트에 맞춰 늘었다 줄었다 하므로(반응형), 가용 폭(body
     기준)·높이(60vh, CSS의 max-height와 동일 기준)를 직접 재서 맞는 스케일을
     계산한다 — 회전 시엔 자연 폭/높이를 맞바꿔서 맞춘 뒤, 그 크기 그대로 90도
     돌리면 다시 가용 영역 안에 들어온다 */
  useEffect(() => {
    if (!mounted || !open) return
    const img = imgRef.current
    const body = bodyRef.current
    if (!img || !body) return

    const update = () => {
      if (!img.naturalWidth) return
      const nw = img.naturalWidth
      const nh = img.naturalHeight
      const portrait = nh > nw
      const maxW = body.clientWidth
      const maxH = window.innerHeight * 0.6

      const scale = portrait ? Math.min(maxW / nh, maxH / nw) : Math.min(maxW / nw, maxH / nh)
      setFit({ w: nw * scale, h: nh * scale, rotated: portrait, scale })
    }

    const observer = new ResizeObserver(update)
    observer.observe(body)
    img.addEventListener('load', update)
    update()

    return () => {
      observer.disconnect()
      img.removeEventListener('load', update)
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

  const markers = fit && (
    <>
      {regions.map((r) => (
        <span
          key={r.id}
          className={`image-bbox-modal__marker image-bbox-modal__marker--${r.tone ?? 'neutral'}`}
          style={{
            left: r.bbox.x * fit.scale,
            top: r.bbox.y * fit.scale,
            width: r.bbox.width * fit.scale,
            height: r.bbox.height * fit.scale,
          }}
        >
          {r.label && <span className="image-bbox-modal__marker-label">{r.label}</span>}
        </span>
      ))}
    </>
  )

  return createPortal(
    <div className="image-bbox-modal-overlay" data-visible={visible} onClick={onClose}>
      <div className="image-bbox-modal" onClick={(e) => e.stopPropagation()}>
        <div className="image-bbox-modal__header">
          <span className="image-bbox-modal__title">{title}</span>
          <button type="button" className="image-bbox-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="image-bbox-modal__body" ref={bodyRef}>
          <div
            className="image-bbox-modal__img-container"
            style={
              fit
                ? { width: fit.rotated ? fit.h : fit.w, height: fit.rotated ? fit.w : fit.h }
                : undefined
            }
          >
            <div
              className="image-bbox-modal__rotor"
              style={
                fit
                  ? { width: fit.w, height: fit.h, transform: fit.rotated ? 'rotate(90deg)' : 'none' }
                  : undefined
              }
            >
              <img ref={imgRef} src={imageUrl} alt={title} className="image-bbox-modal__img" />
              {markers}
            </div>
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
