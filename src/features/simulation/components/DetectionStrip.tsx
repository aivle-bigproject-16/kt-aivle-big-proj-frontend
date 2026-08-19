import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/core/navigation/routes'
import { defectTypeLabel } from '@/shared/utils/defectTypeLabel'
import type { Bbox } from '@/features/battery/types'
import { useSimulationStore } from '../store/useSimulationStore'
import { useDetectionStore, DETECTION_CARD_LIMIT, type DetectionCard } from '../store/useDetectionStore'
import './DetectionStrip.css'

/** 탐지 영역 주위로 남길 여유. 1이면 bbox가 썸네일에 꽉 차 맥락이 사라진다 */
const CROP_PADDING = 2.4
/** 확대 상한. 아주 작은 bbox 를 그대로 맞추면 픽셀이 뭉개진다 */
const CROP_MAX_ZOOM = 8

interface CropStyles {
  img: CSSProperties
  box: CSSProperties | null
}

interface WorkSize {
  w: number
  h: number
}

/**
 * 썸네일을 탐지 영역 중심으로 잘라낸다.
 *
 * 단순 `object-fit: cover` 는 이미지 한가운데를 남기는데, CT 원본이 4000×530처럼
 * 극단적으로 납작해서 정작 결함이 있는 자리가 잘려나간다. 탐지 카드가 탐지 영역을
 * 못 보여주면 카드를 둘 이유가 없으므로, bbox 중심으로 확대해 잘라낸다.
 * bbox 가 없는(결함 없는) 셀은 종전대로 가운데를 남긴다.
 *
 * 원본이 세로로 긴(portrait) 경우 긴 쪽이 항상 가로가 되도록 90도 돌린다 — holder의
 * 실제(고정) 크기는 img가 아니라 holderRef로 직접 재고(회전용 래퍼를 나중에 끼워
 * 넣어도 흔들리지 않는다), 가로/세로를 맞바꾼 크기를 이 크롭 계산에 넘긴 뒤 그
 * 결과(img+box)를 통째로 담은 래퍼를 90도 돌리면 다시 holder 크기에 맞아떨어진다
 */
function useDetectionCrop(holderRef: RefObject<HTMLDivElement | null>, bbox: Bbox | null) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<CropStyles | null>(null)
  const [rotated, setRotated] = useState(false)
  const [workSize, setWorkSize] = useState<WorkSize | null>(null)

  const handleLoad = () => {
    const img = imgRef.current
    const holder = holderRef.current
    if (!img || !holder || !img.naturalWidth) return

    const nw = img.naturalWidth
    const nh = img.naturalHeight
    const portrait = nh > nw
    const realW = holder.clientWidth
    const realH = holder.clientHeight
    const cw = portrait ? realH : realW
    const ch = portrait ? realW : realH
    setRotated(portrait)
    setWorkSize({ w: cw, h: ch })

    /* 어떤 배율이든 이 값 밑으로 내려가면 썸네일에 빈 여백이 생긴다 */
    const cover = Math.max(cw / nw, ch / nh)

    if (!bbox) {
      const w = nw * cover
      const h = nh * cover
      setCrop({ img: { width: w, height: h, left: (cw - w) / 2, top: (ch - h) / 2 }, box: null })
      return
    }

    const fit = Math.min(cw / (bbox.width * CROP_PADDING), ch / (bbox.height * CROP_PADDING))
    const scale = Math.min(Math.max(fit, cover), cover * CROP_MAX_ZOOM)
    const w = nw * scale
    const h = nh * scale

    /* bbox 중심을 썸네일 중심에 놓되, 이미지 바깥이 드러나지 않도록 가장자리에서 멈춘다 */
    const left = Math.min(0, Math.max(cw - w, cw / 2 - (bbox.x + bbox.width / 2) * scale))
    const top = Math.min(0, Math.max(ch - h, ch / 2 - (bbox.y + bbox.height / 2) * scale))

    setCrop({
      img: { width: w, height: h, left, top },
      box: {
        left: left + bbox.x * scale,
        top: top + bbox.y * scale,
        width: bbox.width * scale,
        height: bbox.height * scale,
      },
    })
  }

  return { imgRef, crop, rotated, workSize, handleLoad }
}

/**
 * 탐지 카드 스트립 — 모델이 방금 무엇을 찾았는지 보여준다.
 *
 * 트윈 라인은 셀이 어느 단계에 있는지(상태)와 몇 개인지(집계)만 말한다. 모델이 실제로
 * 산출한 값 — 썸네일·bbox·결함 유형·신뢰도 — 은 배터리 상세 안쪽에만 있었다.
 * 그 대표값을 메인 화면 1-depth 로 끌어올린 자리다 (DASHBOARD_REDESIGN.md §4.5).
 */
function DetectionStrip() {
  const completed = useSimulationStore((s) => s.completedOrdered)
  const cards = useDetectionStore((s) => s.cards)
  const { sync, reset } = useDetectionStore((s) => s.actions)

  useEffect(() => {
    /* 시뮬레이션을 새로 시작하면 완료 목록이 비워진다 — 지난 판의 카드를 남기지 않는다 */
    if (completed.length === 0) {
      reset()
      return
    }
    void sync(completed)
  }, [completed, sync, reset])

  return (
    <section className="detection-strip">
      <header className="detection-strip__header">
        <div className="detection-strip__title-group">
          <h3 className="detection-strip__title">탐지 결과</h3>
          <span className="detection-strip__subtitle">DETECTION</span>
        </div>
        <span className="detection-strip__hint">최근 완료 {DETECTION_CARD_LIMIT}건 · 클릭하면 상세로 이동</span>
      </header>

      <div className="detection-strip__cards">
        {cards.length === 0
          ? Array.from({ length: DETECTION_CARD_LIMIT }, (_, i) => <DetectionPlaceholder key={i} />)
          : cards.map((card) => <DetectionCardItem key={card.batteryCellId} card={card} />)}
      </div>
    </section>
  )
}

function DetectionCardItem({ card }: { card: DetectionCard }) {
  const navigate = useNavigate()
  const holderRef = useRef<HTMLDivElement>(null)
  const { imgRef, crop, rotated, workSize, handleLoad } = useDetectionCrop(holderRef, card.bbox)
  const tone = card.finalLabel.toLowerCase()

  const rotorStyle: CSSProperties | undefined =
    rotated && workSize
      ? {
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: workSize.w,
          height: workSize.h,
          transform: 'translate(-50%, -50%) rotate(90deg)',
        }
      : undefined

  const frame = (
    <>
      <img
        ref={imgRef}
        src={card.imageUrl}
        alt={`셀 ${card.batteryCellId} 검사 이미지`}
        className="detection-card__img"
        style={crop?.img ?? { opacity: 0 }}
        onLoad={handleLoad}
      />
      {crop?.box && (
        <span className={`detection-card__bbox detection-card__bbox--${tone}`} style={crop.box} />
      )}
    </>
  )

  return (
    <button
      type="button"
      className="detection-card"
      onClick={() => navigate(ROUTES.BATTERY_DETAIL(card.batteryCellId))}
    >
      <div className="detection-card__thumb" ref={holderRef}>
        {rotorStyle ? <div style={rotorStyle}>{frame}</div> : frame}
        <span className="detection-card__type">{card.imageType}</span>
      </div>

      <div className="detection-card__meta">
        <span className="detection-card__cell">CELL-{card.batteryCellId}</span>
        <span className={`detection-card__verdict detection-card__verdict--${tone}`}>{card.finalLabel}</span>
      </div>

      <div className="detection-card__foot">
        <span className="detection-card__defect">
          {card.defectType ? defectTypeLabel(card.defectType) : '결함 없음'}
        </span>
        <span className="detection-card__confidence">
          {card.confidence !== null ? `신뢰도 ${(card.confidence * 100).toFixed(1)}%` : '-'}
        </span>
      </div>
    </button>
  )
}

/** 아직 완료된 셀이 없을 때의 자리. 카드가 채워져도 스트립 높이가 변하지 않게 한다 */
function DetectionPlaceholder() {
  return (
    <div className="detection-card detection-card--empty">
      <div className="detection-card__thumb" />
      <div className="detection-card__meta">
        <span className="detection-card__cell detection-card__cell--empty">대기 중</span>
      </div>
    </div>
  )
}

export { DetectionStrip }
