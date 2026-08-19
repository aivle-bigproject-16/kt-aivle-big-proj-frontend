import { useRef, useState, type ReactNode } from 'react'
import { ImageBboxModal } from '@/shared/ui/ImageBboxModal'
import { RotatingImage } from '@/shared/ui/RotatingImage'
import type { Inspection } from '../types'
import './InspectionImageSection.css'

const LABEL_TONE: Record<string, 'reject' | 'fail' | 'pass'> = {
  REJECT: 'reject',
  FAIL: 'fail',
  PASS: 'pass',
}

interface ImageSectionProps {
  images: Inspection['images']
  defects: Inspection['defectResults']
  /** 결함 목록(우측 패널)과 번호/강조 상태를 공유하기 위한 상태 끌어올리기 */
  activeImageId: number | null
  onSelectImage: (imageId: number) => void
}

/** 히어로는 잘림 없이 너비를 항상 꽉 채워야 한다 — "안 잘림"과 "너비 꽉 채움"을
   고정 비율 박스 안에서 동시에 만족시킬 수는 없으므로(비율이 안 맞으면 letterbox
   아니면 crop 둘 중 하나), 박스 높이를 이미지 비율에 맞춰 매번 다시 계산한다.
   폭(W)은 고정, 높이(H) = W × (짧은 변 / 긴 변) — 세로로 긴(portrait) 원본이면
   긴 변이 가로가 되도록 90도 돌리므로, 회전 여부와 무관하게 "항상 긴 변 대 짧은
   변" 비율로 H를 잡으면 그대로 꽉 차면서 잘리는 부분이 없다.
   회전 시 img+마커는 가로/세로를 맞바꾼 작업 박스(rotor)에 넣고 그 박스를
   통째로 90도 돌린다 — 좌표계가 공유되어 마커가 어긋나지 않는다 */
function useAdaptiveHero() {
  const heroRef = useRef<HTMLButtonElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const [rotated, setRotated] = useState(false)
  const [boxSize, setBoxSize] = useState<{ w: number; h: number } | null>(null)
  const [workSize, setWorkSize] = useState<{ w: number; h: number } | null>(null)

  const handleLoad = () => {
    const img = imgRef.current
    const hero = heroRef.current
    if (!img || !hero || !img.naturalWidth) return
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    const portrait = nh > nw

    const W = hero.clientWidth
    const longSide = Math.max(nw, nh)
    const shortSide = Math.min(nw, nh)
    const H = (W * shortSide) / longSide

    setBoxSize({ w: W, h: H })
    setRotated(portrait)
    setWorkSize(portrait ? { w: H, h: W } : { w: W, h: H })
    // 박스 비율이 이미지 비율과 정확히 일치하도록 만들었으니 letterbox/crop 여백이 없다
    const s = W / longSide
    setScale({ sx: s, sy: s, ox: 0, oy: 0 })
  }

  return { heroRef, imgRef, scale, rotated, boxSize, workSize, handleLoad }
}

/** rotated일 때만 img+마커를 작업 박스 크기의 래퍼로 감싸 90도 돌린다 —
   img와 마커가 같은 좌표계를 공유하는 채로 통째로 회전해 서로 어긋나지 않는다 */
function HeroFrame({
  rotated,
  workSize,
  children,
}: {
  rotated: boolean
  workSize: { w: number; h: number } | null
  children: ReactNode
}) {
  if (!rotated || !workSize) return <>{children}</>
  return (
    <div className="battery-detail__image-rotor" style={{ width: workSize.w, height: workSize.h }}>
      {children}
    </div>
  )
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

  const { heroRef, imgRef, scale, rotated, boxSize, workSize, handleLoad } = useAdaptiveHero()
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
        ref={heroRef}
        type="button"
        className="battery-detail__image-hero"
        style={boxSize ? { height: boxSize.h } : undefined}
        onClick={() => activeImage && setModalOpen(true)}
      >
        {activeImage && (
          <HeroFrame rotated={rotated} workSize={workSize}>
            <img
              ref={imgRef}
              src={activeImage.imageUrl}
              alt={`${activeImage.imageType} · IMG-${activeImage.imageId}`}
              className="battery-detail__image-hero-img"
              onLoad={handleLoad}
            />
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
          </HeroFrame>
        )}
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
              <RotatingImage src={img.imageUrl} alt={`${img.imageType} · IMG-${img.imageId}`} />
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
            .map((d) => ({ id: d.defectResultId, bbox: d.bbox!, tone: LABEL_TONE[d.label] ?? 'pass', label: d.orderNo }))}
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
