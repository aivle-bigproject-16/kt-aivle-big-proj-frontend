import { useRef, useState } from 'react'
import { ImageBboxModal } from '@/shared/ui/ImageBboxModal'
import type { Inspection } from '../types'
import './InspectionImageSection.css'

const LABEL_TONE: Record<string, 'reject' | 'fail' | 'pass'> = {
  REJECT: 'reject',
  FAIL: 'fail',
  PASS: 'pass',
}

interface ImageSectionProps {
  images: Inspection['image']
  defects: Inspection['defectResults']
  /** 결함 목록(우측 패널)과 번호/강조 상태를 공유하기 위한 상태 끌어올리기 */
  activeImageId: number | null
  onSelectImage: (imageId: number) => void
}

function useCoverScale() {
  const imgRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

  const handleLoad = () => {
    const img = imgRef.current
    if (!img || !img.naturalWidth) return
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    const dw = img.clientWidth
    const dh = img.clientHeight
    const s = Math.max(dw / nw, dh / nh)
    setScale({ sx: s, sy: s, ox: (dw - nw * s) / 2, oy: (dh - nh * s) / 2 })
  }

  return { imgRef, scale, handleLoad }
}

/** 검사 이미지 뷰어 — 좌측 열. CT/RGB 탭 + 히어로 이미지(결함 bbox 번호 마커) +
   캡션 + 썸네일 스트립. 번호는 defects 배열 전체 순서를 그대로 쓴다(우측 결함
   목록과 번호가 일치하게) */
function ImageSection({ images, defects, activeImageId, onSelectImage }: ImageSectionProps) {
  const ctImages = images.filter((i) => i.imageType === 'CT')
  const rgbImages = images.filter((i) => i.imageType === 'RGB')
  const hasBothTypes = ctImages.length > 0 && rgbImages.length > 0

  const activeImage = images.find((i) => i.imageId === activeImageId) ?? images[0] ?? null
  const tab = activeImage?.imageType ?? (ctImages.length > 0 ? 'CT' : 'RGB')
  const shown = tab === 'CT' ? ctImages : rgbImages

  const { imgRef, scale, handleLoad } = useCoverScale()
  const [modalOpen, setModalOpen] = useState(false)

  if (images.length === 0) {
    return (
      <div className="battery-detail__image-section">
        <p className="battery-detail__empty">이미지가 없습니다.</p>
      </div>
    )
  }

  const activeDefects = activeImage
    ? defects
        .map((d, i) => ({ ...d, orderNo: i + 1 }))
        .filter((d) => d.imageId === activeImage.imageId && d.bbox)
    : []

  return (
    <div className="battery-detail__image-section">
      {hasBothTypes && (
        <div className="battery-detail__image-tabs">
          <button
            type="button"
            className={`battery-detail__image-tab${tab === 'CT' ? ' battery-detail__image-tab--active' : ''}`}
            onClick={() => ctImages[0] && onSelectImage(ctImages[0].imageId)}
          >
            CT ({ctImages.length})
          </button>
          <button
            type="button"
            className={`battery-detail__image-tab${tab === 'RGB' ? ' battery-detail__image-tab--active' : ''}`}
            onClick={() => rgbImages[0] && onSelectImage(rgbImages[0].imageId)}
          >
            RGB ({rgbImages.length})
          </button>
        </div>
      )}

      <button
        type="button"
        className="battery-detail__image-hero"
        onClick={() => activeImage && setModalOpen(true)}
      >
        {activeImage && (
          <img
            ref={imgRef}
            src={activeImage.imageUrl}
            alt={`${activeImage.imageType} · IMG-${activeImage.imageId}`}
            className="battery-detail__image-hero-img"
            onLoad={handleLoad}
          />
        )}
        {scale &&
          activeDefects.map((d) => (
            <span
              key={d.defectResultId}
              className={`battery-detail__image-marker battery-detail__image-marker--${d.label.toLowerCase()}`}
              style={{
                left: scale.ox + d.bbox!.x * scale.sx,
                top: scale.oy + d.bbox!.y * scale.sy,
                width: d.bbox!.width * scale.sx,
                height: d.bbox!.height * scale.sy,
              }}
            >
              <span className="battery-detail__image-marker-num">{d.orderNo}</span>
            </span>
          ))}
      </button>

      {activeImage && (
        <span className="battery-detail__image-caption">
          {activeImage.imageType} · IMG-{activeImage.imageId}
        </span>
      )}

      {shown.length > 0 && (
        <div className="battery-detail__image-thumbs">
          {shown.map((img) => (
            <button
              key={img.imageId}
              type="button"
              className={`battery-detail__image-thumb${img.imageId === activeImage?.imageId ? ' battery-detail__image-thumb--active' : ''}`}
              onClick={() => onSelectImage(img.imageId)}
            >
              <img src={img.imageUrl} alt={`${img.imageType} · IMG-${img.imageId}`} />
            </button>
          ))}
        </div>
      )}

      {activeImage && (
        <ImageBboxModal
          title={`${activeImage.imageType} · IMG-${activeImage.imageId}`}
          imageUrl={activeImage.imageUrl}
          regions={activeDefects
            .filter((d) => d.bbox)
            .map((d) => ({ id: d.defectResultId, bbox: d.bbox!, tone: LABEL_TONE[d.label] ?? 'pass' }))}
          infoItems={activeDefects.map((d) => ({
            id: d.defectResultId,
            badgeText: d.label,
            badgeTone: LABEL_TONE[d.label] ?? 'pass',
            primaryText: d.defectType,
            secondaryText: `${d.imageType} · 신뢰도 ${Math.round(d.confidence * 100)}%`,
          }))}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

export { ImageSection }
