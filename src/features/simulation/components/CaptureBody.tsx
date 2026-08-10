import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSimulationStore } from '../store/useSimulationStore'
import { ROUTES } from '@/core/navigation/routes'
import type { CellProgress } from '../types'
import './CaptureBody.css'

/* 새로 생긴 배치가 등장 애니메이션을 재생하는 시간. CaptureBody.css의
   capture-body-batch-enter와 맞춘다 */
const ENTER_DURATION_MS = 1000

/* capture 배열은 mock-server에서 새 배치가 뒤에 追加되므로(capture = [...capture, ...batchCells]),
   Map의 삽입 순서(= [...map.entries()])는 오래된 배치가 앞(batch 1이 맨 위)이다.
   최신 배치가 위, batch 1(가장 오래됨)이 맨 아래로 오도록 뒤집는다 */
function groupByBatch(cells: CellProgress[]) {
  const map = new Map<number, CellProgress[]>()
  for (const c of cells) {
    const list = map.get(c.batchId)
    if (list) list.push(c)
    else map.set(c.batchId, [c])
  }
  return [...map.entries()].reverse()
}

/** 촬영 본문 — PendingBody와 동일한 형태, 데이터만 capture 배열로 바뀜. 1400×860 흰 카드.
   배치는 기본적으로 모두 펼쳐진 채 유지된다 — 새 배치가 위에 생겨도 기존 배치가
   닫히지 않고 펼쳐진 채로 아래로 내려간다. 클릭하면 개별적으로 접었다 펼 수 있다 */
function CaptureBody() {
  /* capture 배열 자체를 구독하고 그룹핑은 useMemo로 — 셀렉터 안에서 매번 새 배열을
     만들면 참조가 매 렌더마다 달라져 getSnapshot 무한 루프(Maximum update depth
     exceeded)가 난다 */
  const capture = useSimulationStore((s) => s.capture)
  const batches = useMemo(() => groupByBatch(capture), [capture])

  /* 기본은 전부 펼침 — 사용자가 클릭해서 직접 접은 배치만 collapsedIds에 담는다 */
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set())
  const toggle = (batchId: number) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(batchId)) next.delete(batchId)
      else next.add(batchId)
      return next
    })
  }
  const isExpanded = (batchId: number) => !collapsedIds.has(batchId)

  /* 새로 생긴 배치(이전엔 없던 batchId)를 잠깐 entering으로 표시해 등장 애니메이션을
     재생한다. 기존 배치들은 펼쳐진 채로 유지되고 위치만 아래로 내려간다 */
  const [enteringIds, setEnteringIds] = useState<Set<number>>(new Set())
  const prevIdsRef = useRef<Set<number> | null>(null)
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const currentIds = new Set(batches.map(([id]) => id))
    const prevIds = prevIdsRef.current
    prevIdsRef.current = currentIds

    if (prevIds === null) return // 최초 로드시에는 등장 애니메이션을 재생하지 않는다

    const newIds = [...currentIds].filter((id) => !prevIds.has(id))
    if (newIds.length === 0) return

    setEnteringIds((prev) => new Set([...prev, ...newIds]))
    const timer = setTimeout(() => {
      if (!mountedRef.current) return
      setEnteringIds((prev) => {
        const next = new Set(prev)
        for (const id of newIds) next.delete(id)
        return next
      })
    }, ENTER_DURATION_MS)
    return () => clearTimeout(timer)
  }, [batches])

  return (
    <div className="capture-body">
      <div className="capture-body__list">
        {batches.length === 0 ? (
          <EmptyBatchRow />
        ) : (
          batches.map(([batchId, cells], i) => {
            const expanded = isExpanded(batchId)
            return (
              <BatchRow
                key={batchId}
                batchId={batchId}
                cells={cells}
                expanded={expanded}
                isNext={i === 0}
                entering={enteringIds.has(batchId)}
                onToggle={() => toggle(batchId)}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

function BatchRow({
  batchId,
  cells,
  expanded,
  isNext,
  entering,
  onToggle,
}: {
  batchId: number
  cells: CellProgress[]
  expanded: boolean
  isNext: boolean
  entering?: boolean
  onToggle: () => void
}) {
  return (
    <div className={`capture-body__batch${entering ? ' capture-body__batch--entering' : ''}`}>
      <button
        type="button"
        className={`capture-body__batch-header${expanded ? ' capture-body__batch-header--expanded' : ' capture-body__batch-header--collapsed'}`}
        onClick={onToggle}
      >
        <svg
          className={`capture-body__chevron${expanded ? ' capture-body__chevron--expanded' : ''}`}
          width="17"
          height="9"
          viewBox="0 0 17 9"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 1L8.45 9.45L15.9 1"
            stroke="#5B5F63"
            strokeWidth="2.17"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <span className={`capture-body__batch-title${expanded ? '' : ' capture-body__batch-title--collapsed'}`}>
          Batch #{batchId}
        </span>
        <span className="capture-body__batch-count">{cells.length} cells</span>
        {isNext && <span className="capture-body__batch-next-hint">촬영 중</span>}
      </button>

      <div className={`capture-body__cells${expanded ? '' : ' capture-body__cells--collapsed'}`}>
        {[...cells].reverse().map((cell) => (
          <CaptureBatteryCell key={cell.batteryCellId} batteryCellId={cell.batteryCellId} />
        ))}
      </div>
    </div>
  )
}

/** 촬영 중인 배치가 없을 때 보여주는 빈 배치 카드 — 셀 없이 헤더만 표시한다 */
function EmptyBatchRow() {
  return (
    <div className="capture-body__batch">
      <div className="capture-body__batch-header capture-body__batch-header--collapsed">
        <span className="capture-body__batch-title capture-body__batch-title--collapsed">
          Batch #0
        </span>
        <span className="capture-body__batch-count">0 cells</span>
      </div>
    </div>
  )
}

function CaptureBatteryCell({ batteryCellId }: { batteryCellId: number }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className="capture-body__cell"
      onClick={() => navigate(ROUTES.BATTERY_DETAIL(batteryCellId))}
    >
      <CaptureBatteryIcon />
      <span className="capture-body__cell-id">CELL-{batteryCellId}</span>
    </button>
  )
}

function CaptureBatteryIcon() {
  return (
    <svg width="17" height="31" viewBox="0 0 17 31" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.0371 0L5.7514 0C5.35691 0 5.03711 0.319799 5.03711 0.714292L5.03711 1.42858C5.03711 1.82308 5.35691 2.14288 5.7514 2.14288L10.0371 2.14288C10.4316 2.14288 10.7514 1.82308 10.7514 1.42858V0.714292C10.7514 0.319799 10.4316 0 10.0371 0Z"
        fill="#94A3B8"
      />
      <path
        d="M14.25 2L2.25 2C1.42157 2 0.75 2.64287 0.75 3.4359L0.75 28.5641C0.75 29.3571 1.42157 30 2.25 30H14.25C15.0784 30 15.75 29.3571 15.75 28.5641L15.75 3.4359C15.75 2.64287 15.0784 2 14.25 2Z"
        stroke="#2ECC71"
        strokeWidth="1.5"
      />
      <rect x="2.75" y="4" width="11" height="24" fill="#2ECC71" />
    </svg>
  )
}

export { CaptureBody }
