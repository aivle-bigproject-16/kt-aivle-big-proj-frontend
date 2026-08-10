import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSimulationStore } from '../store/useSimulationStore'
import { ROUTES } from '@/core/navigation/routes'
import type { CellProgress } from '../types'
import './PendingBody.css'

/* 접힌 배치가 여러 개일 때 아래로 갈수록 옅어지는 느낌만 주면 되므로 마지막 값을 계속 재사용한다 */
const COLLAPSED_OPACITIES = [1, 1, 1, 0.8, 0.7, 0.5]

/* 배치가 촬영 단계로 넘어가 registered에서 사라질 때, 펼쳐져 있었는지 여부와 상관없이
   접히는 과정 없이 그대로(행 전체가 옅어지며) 사라진다. 그동안 다음 배치가 자연스럽게
   그 자리를 채우고, 사라짐이 끝나면 대기열 맨 앞이 되면서 자동으로 펼쳐진다 */
const LEAVE_DURATION_MS = 350

interface LeavingEntry {
  cells: CellProgress[]
}

function groupByBatch(cells: CellProgress[]) {
  const map = new Map<number, CellProgress[]>()
  for (const c of cells) {
    const list = map.get(c.batchId)
    if (list) list.push(c)
    else map.set(c.batchId, [c])
  }
  return [...map.entries()].sort(([a], [b]) => a - b)
}

/** 펜딩 본문 — 1400×860 흰 카드. 배치를 클릭하면 펼쳐져서 하위 셀 목록을 보여준다.
   대기열 맨 앞 배치는 기본으로 펼쳐져 있고, 나머지는 접힌 채(아래로 갈수록 옅어짐) 시작한다 */
function PendingBody() {
  /* registered 자체를 구독하고 그룹핑은 useMemo로 — 셀렉터 안에서 매번 새 배열을
     만들면 참조가 매 렌더마다 달라져 getSnapshot 무한 루프(Maximum update depth
     exceeded)가 난다 */
  const registered = useSimulationStore((s) => s.registered)
  const batches = useMemo(() => groupByBatch(registered), [registered])

  /* 사용자가 아직 아무것도 건드리지 않았으면(빈 Set) 맨 앞 배치를 기본으로 펼친다.
     한 번이라도 클릭하면 그 이후는 전적으로 이 Set을 따른다 */
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const toggle = (batchId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev.size === 0 && batches[0] ? [batches[0][0]] : prev)
      if (next.has(batchId)) next.delete(batchId)
      else next.add(batchId)
      return next
    })
  }
  /* 대기열 맨 앞 배치가 소멸하는 동안, 승격된 다음 배치가 곧바로 펼쳐지지 않도록
     막아둔다 — 사라지는 배치가 완전히 사라진 뒤에야 다음 배치가 펼쳐져야 하므로 */
  const [suppressFrontId, setSuppressFrontId] = useState<number | null>(null)
  const isExpanded = (batchId: number, index: number) =>
    expandedIds.size === 0 ? index === 0 && batchId !== suppressFrontId : expandedIds.has(batchId)

  /* registered에서 사라진 배치를 곧바로 걷어내지 않고, leaving으로 표시해 소멸
     애니메이션(닫힘 → 사라짐)이 끝날 때까지 원래 위치에 남겨둔다. 사라지는 시점엔
     이미 registered에 그 배치의 셀이 없으므로, 직전 렌더의 batches를 ref에
     저장해뒀다가 그 셀 목록과 펼침 상태를 읽어온다 */
  const [leavingBatches, setLeavingBatches] = useState<Map<number, LeavingEntry>>(new Map())
  const prevBatchesRef = useRef<Map<number, CellProgress[]>>(new Map())
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const currentIds = new Set(batches.map(([id]) => id))
    const prevOrderIds = [...prevBatchesRef.current.keys()]
    const removed = [...prevBatchesRef.current].filter(([id]) => !currentIds.has(id))
    prevBatchesRef.current = new Map(batches)

    if (removed.length === 0) return

    setLeavingBatches((prev) => {
      const next = new Map(prev)
      for (const [id, cells] of removed) next.set(id, { cells })
      return next
    })

    for (const [id] of removed) {
      const prevIndex = prevOrderIds.indexOf(id)
      const wasExpanded = expandedIds.size === 0 ? prevIndex === 0 : expandedIds.has(id)

      /* 자동 펼침(expandedIds가 비어 있는) 모드에서 대기열 맨 앞 배치가 사라지는 경우,
         승격된 다음 배치가 이 배치의 소멸 애니메이션이 끝날 때까지 펼쳐지지 않게 막는다 */
      if (wasExpanded && expandedIds.size === 0 && prevIndex === 0) {
        const nextFrontId = batches[0]?.[0]
        if (nextFrontId !== undefined) {
          setSuppressFrontId(nextFrontId)
          setTimeout(() => {
            if (!mountedRef.current) return
            setSuppressFrontId((cur) => (cur === nextFrontId ? null : cur))
          }, LEAVE_DURATION_MS)
        }
      }

      setTimeout(() => {
        if (!mountedRef.current) return
        setLeavingBatches((prev) => {
          const next = new Map(prev)
          next.delete(id)
          return next
        })
      }, LEAVE_DURATION_MS)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batches])

  let collapsedRank = 0
  const leavingEntries = [...leavingBatches].sort(([a], [b]) => a - b)

  return (
    <div className="pending-body">
      <div className="pending-body__list">
        {batches.length === 0 && leavingBatches.size === 0 ? (
          <EmptyBatchRow />
        ) : (
          <>
            {leavingEntries.map(([batchId, entry]) => (
              <BatchRow
                key={`leaving-${batchId}`}
                batchId={batchId}
                cells={entry.cells}
                expanded={false}
                opacity={1}
                isNext={false}
                leaving
                onToggle={() => {}}
              />
            ))}
            {batches.map(([batchId, cells], i) => {
              const expanded = isExpanded(batchId, i)
              const opacity = expanded ? 1 : COLLAPSED_OPACITIES[Math.min(collapsedRank++, COLLAPSED_OPACITIES.length - 1)]
              return (
                <BatchRow
                  key={batchId}
                  batchId={batchId}
                  cells={cells}
                  expanded={expanded}
                  opacity={opacity}
                  isNext={i === 0}
                  onToggle={() => toggle(batchId)}
                />
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

function BatchRow({
  batchId,
  cells,
  expanded,
  opacity,
  isNext,
  leaving,
  onToggle,
}: {
  batchId: number
  cells: CellProgress[]
  expanded: boolean
  opacity: number
  isNext: boolean
  leaving?: boolean
  onToggle: () => void
}) {
  return (
    <div className={`pending-body__batch${leaving ? ' pending-body__batch--leaving' : ''}`}>
      <button
        type="button"
        className={`pending-body__batch-header${expanded ? ' pending-body__batch-header--expanded' : ' pending-body__batch-header--collapsed'}`}
        style={{ opacity }}
        onClick={onToggle}
        disabled={leaving}
      >
        <svg
          className={`pending-body__chevron${expanded ? ' pending-body__chevron--expanded' : ''}`}
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
        <span className={`pending-body__batch-title${expanded ? '' : ' pending-body__batch-title--collapsed'}`}>
          Batch #{batchId}
        </span>
        <span className="pending-body__batch-count">{cells.length} cells</span>
        {isNext && <span className="pending-body__batch-next-hint">다음 촬영 대상</span>}
      </button>

      <div
        className={`pending-body__cells${expanded ? '' : ' pending-body__cells--collapsed'}`}
      >
        {cells.map((cell) => (
          <PendingCell key={cell.batteryCellId} batteryCellId={cell.batteryCellId} />
        ))}
      </div>
    </div>
  )
}

/** 대기 중인 배치가 없을 때 보여주는 빈 배치 카드 — 셀 없이 헤더만 표시한다 */
function EmptyBatchRow() {
  return (
    <div className="pending-body__batch">
      <div className="pending-body__batch-header pending-body__batch-header--collapsed">
        <span className="pending-body__batch-title pending-body__batch-title--collapsed">
          Batch #0
        </span>
        <span className="pending-body__batch-count">0 cells</span>
      </div>
    </div>
  )
}

function PendingCell({ batteryCellId }: { batteryCellId: number }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className="pending-body__cell"
      onClick={() => navigate(ROUTES.BATTERY_DETAIL(batteryCellId))}
    >
      <PendingBatteryIcon />
      <span className="pending-body__cell-id">CELL-{batteryCellId}</span>
    </button>
  )
}

function PendingBatteryIcon() {
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

export { PendingBody }
