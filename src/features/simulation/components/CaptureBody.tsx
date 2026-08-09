import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSimulationStore } from '../store/useSimulationStore'
import { ROUTES } from '@/core/navigation/routes'
import type { CellProgress } from '../types'
import './CaptureBody.css'

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
   배치를 클릭하면 펼쳐져서 하위 셀 목록을 보여준다. 맨 위(가장 최근에 들어온) 배치는
   기본으로 펼쳐져 있고, 나머지는 접힌 채 시작한다 — 옅어지는 효과는 없다 */
function CaptureBody() {
  /* capture 배열 자체를 구독하고 그룹핑은 useMemo로 — 셀렉터 안에서 매번 새 배열을
     만들면 참조가 매 렌더마다 달라져 getSnapshot 무한 루프(Maximum update depth
     exceeded)가 난다 */
  const capture = useSimulationStore((s) => s.capture)
  const batches = useMemo(() => groupByBatch(capture), [capture])

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
  const isExpanded = (batchId: number, index: number) =>
    expandedIds.size === 0 ? index === 0 : expandedIds.has(batchId)

  return (
    <div className="capture-body">
      <div className="capture-body__list">
        {batches.length === 0 ? (
          <EmptyBatchRow />
        ) : (
          batches.map(([batchId, cells], i) => {
            const expanded = isExpanded(batchId, i)
            return (
              <BatchRow
                key={batchId}
                batchId={batchId}
                cells={cells}
                expanded={expanded}
                isNext={i === 0}
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
  onToggle,
}: {
  batchId: number
  cells: CellProgress[]
  expanded: boolean
  isNext: boolean
  onToggle: () => void
}) {
  return (
    <div className="capture-body__batch">
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

      {expanded && (
        <div className="capture-body__cells">
          {cells.map((cell) => (
            <CaptureBatteryCell key={cell.batteryCellId} batteryCellId={cell.batteryCellId} />
          ))}
        </div>
      )}
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
