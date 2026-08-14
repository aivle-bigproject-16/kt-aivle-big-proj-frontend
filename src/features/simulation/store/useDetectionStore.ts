import { create } from 'zustand'
import { detectionService } from '../services/detectionService'
import type { CellProgress } from '../types'
import type { Bbox, BatteryDetail, FinalLabel, ImageType } from '@/features/battery/types'

/** 스트립에 세워둘 탐지 카드 수 */
export const DETECTION_CARD_LIMIT = 4

export interface DetectionCard {
  batteryCellId: number
  imageUrl: string
  imageType: ImageType
  /** 모델이 지목한 영역. 결함이 없으면 null 이고 썸네일만 보여준다 */
  bbox: Bbox | null
  finalLabel: FinalLabel
  defectType: string | null
  confidence: number | null
}

interface DetectionState {
  cards: DetectionCard[]
  isLoading: boolean
  actions: {
    /** WS 완료 목록을 받아 새로 들어온 셀만 조회한다 */
    sync: (completed: CellProgress[]) => Promise<void>
    reset: () => void
  }
}

/* 리렌더와 무관한 내부 장부라 스토어 상태로 두지 않는다 — socketService 가 소켓을
   모듈 싱글턴으로 갖는 것과 같은 취급이다 */
const fetched = new Set<number>()
/** 직전 스냅샷의 완료 셀 id. 이번 스냅샷에서 새로 나타난 id 가 곧 방금 끝난 셀이다 */
let seenIds = new Set<number>()
let inFlight = false
let lastFetchAt = 0

/** 완료가 몰릴 때 조회 간격. 어차피 스트립에는 최신 4장만 남으므로 전부 부를 이유가 없다 */
const FETCH_INTERVAL_MS = 800

/**
 * 카드 한 장에 쓸 대표 탐지 결과를 고른다.
 *
 * 한 셀에 검사가 여러 번 있을 수 있는데, 결과가 마지막 검사에 들어 있다는 보장이 없다
 * (재검사 레코드가 비어 있는 셀이 있다). 그래서 마지막 검사만 보지 않고 전체 검사를
 * 훑어 신뢰도가 가장 높은 결함 하나를 대표로 삼는다. 결함이 없으면 이미지가 있는
 * 검사의 첫 장을 썸네일로 쓰고 bbox 없이 판정만 보여준다. 둘 다 없으면 그릴 게
 * 없으므로 카드를 만들지 않는다.
 */
function toCard(detail: BatteryDetail): DetectionCard | null {
  const inspections = detail.inspections ?? []

  const best = inspections
    .flatMap((inspection) =>
      (inspection.defectResults ?? []).map((defect) => ({ defect, inspection })),
    )
    .sort((a, b) => b.defect.confidence - a.defect.confidence)[0]

  if (best) {
    return {
      batteryCellId: detail.batteryCellId,
      imageUrl: best.defect.imageUrl,
      imageType: best.defect.imageType,
      bbox: best.defect.bbox,
      finalLabel: best.defect.label ?? best.inspection.finalLabel,
      defectType: best.defect.defectType,
      confidence: best.defect.confidence,
    }
  }

  const withImage = inspections.find((inspection) => (inspection.images?.length ?? 0) > 0)
  const image = withImage?.images[0]
  if (!withImage || !image) return null

  return {
    batteryCellId: detail.batteryCellId,
    imageUrl: image.imageUrl,
    imageType: image.imageType,
    bbox: null,
    finalLabel: withImage.finalLabel,
    defectType: null,
    confidence: null,
  }
}

export const useDetectionStore = create<DetectionState>((set, get) => ({
  cards: [],
  isLoading: false,
  actions: {
    sync: async (completed) => {
      const ids = completed.map((c) => c.batteryCellId)

      /* 어느 쪽 끝이 최신인지는 서버 구현에 달려 있어(완료 목록의 정렬 방향이
         mock 과 완료 탭에서 서로 다르게 가정돼 있다) 배열 순서를 믿지 않는다.
         직전 스냅샷에 없던 id 가 방금 완료된 셀이며, 이 판정은 순서와 무관하다.
         첫 스냅샷만은 비교 대상이 없어 배열 앞쪽을 최신으로 보고 시작한다 */
      const isFirst = seenIds.size === 0
      const arrived = isFirst
        ? ids.slice(0, DETECTION_CARD_LIMIT)
        : ids.filter((id) => !seenIds.has(id))
      seenIds = new Set(ids)

      if (arrived.length === 0) return

      /* 완료가 몰릴 때 전부 부르지 않는다. 건너뛴 셀은 이미 seenIds 에 들어가 다시
         후보가 되지 않는데, 그 사이 더 새로운 셀이 나오므로 스트립은 최신을 유지한다 */
      const now = Date.now()
      if (inFlight || now - lastFetchAt < FETCH_INTERVAL_MS) return

      const targets = arrived.filter((id) => !fetched.has(id)).slice(0, DETECTION_CARD_LIMIT)
      if (targets.length === 0) return

      /* 조회 성공 여부와 무관하게 재시도하지 않는다. 실패한 셀을 매 스냅샷마다
         다시 부르면 상세가 없는 셀 하나가 무한 요청을 만든다 */
      targets.forEach((id) => fetched.add(id))

      inFlight = true
      lastFetchAt = now
      set({ isLoading: true })
      try {
        const results = await Promise.allSettled(
          targets.map((id) => detectionService.getBatteryDetail(id)),
        )

        const fresh = results
          .map((r) => (r.status === 'fulfilled' ? toCard(r.value.data) : null))
          .filter((c): c is DetectionCard => c !== null)

        if (fresh.length > 0) {
          const existing = get().cards.filter((c) => !fresh.some((f) => f.batteryCellId === c.batteryCellId))
          set({ cards: [...fresh, ...existing].slice(0, DETECTION_CARD_LIMIT) })
        }
      } finally {
        inFlight = false
        set({ isLoading: false })
      }
    },

    reset: () => {
      fetched.clear()
      seenIds = new Set()
      inFlight = false
      lastFetchAt = 0
      set({ cards: [], isLoading: false })
    },
  },
}))
