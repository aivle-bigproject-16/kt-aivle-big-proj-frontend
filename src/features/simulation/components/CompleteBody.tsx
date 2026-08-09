import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSimulationStore } from '../store/useSimulationStore'
import { ROUTES } from '@/core/navigation/routes'
import type { FinalLabel } from '@/features/battery/types'
import type { CellProgress } from '../types'
import './CompleteBody.css'

type CompleteFilter = 'ALL' | FinalLabel

/** 완료 본문 — 1400×700 흰 카드. 상단은 전체/PASS/REJECT/FAIL 카운트 칩, 아래는
   완료된 셀 목록(최근 완료 순). 리스트는 세로 스크롤. 칩을 클릭하면 해당 상태의
   셀만 필터링해서 보여준다 */
function CompleteBody() {
  const completed = useSimulationStore((s) => s.completed)
  const passCount = useMemo(() => completed.filter((c) => c.finalLabel === 'PASS').length, [completed])
  const rejectCount = useMemo(
    () => completed.filter((c) => c.finalLabel === 'REJECT').length,
    [completed],
  )
  const failCount = useMemo(() => completed.filter((c) => c.finalLabel === 'FAIL').length, [completed])

  const [filter, setFilter] = useState<CompleteFilter>('ALL')

  /* completed 배열은 완료 순서대로 뒤에 추가되므로, 최근 완료된 셀이 위로 오도록 뒤집는다 */
  const rows = useMemo(() => {
    const reversed = [...completed].reverse()
    return filter === 'ALL' ? reversed : reversed.filter((c) => c.finalLabel === filter)
  }, [completed, filter])

  return (
    <div className="complete-body">
      <div className="complete-body__chips">
        <button
          type="button"
          className={`complete-body__chip complete-body__chip--all${filter === 'ALL' ? ' complete-body__chip--active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          <span className="complete-body__chip-label">전체</span>
          <span className="complete-body__chip-count">{completed.length}</span>
        </button>
        <button
          type="button"
          className={`complete-body__chip complete-body__chip--pass${filter === 'PASS' ? ' complete-body__chip--active' : ''}`}
          onClick={() => setFilter('PASS')}
        >
          <span className="complete-body__chip-dot" />
          <span className="complete-body__chip-label">PASS</span>
          <span className="complete-body__chip-count">{passCount}</span>
        </button>
        <button
          type="button"
          className={`complete-body__chip complete-body__chip--reject${filter === 'REJECT' ? ' complete-body__chip--active' : ''}`}
          onClick={() => setFilter('REJECT')}
        >
          <span className="complete-body__chip-dot" />
          <span className="complete-body__chip-label">REJECT</span>
          <span className="complete-body__chip-count">{rejectCount}</span>
        </button>
        <button
          type="button"
          className={`complete-body__chip complete-body__chip--fail${filter === 'FAIL' ? ' complete-body__chip--active' : ''}`}
          onClick={() => setFilter('FAIL')}
        >
          <span className="complete-body__chip-dot" />
          <span className="complete-body__chip-label">FAIL</span>
          <span className="complete-body__chip-count">{failCount}</span>
        </button>
      </div>

      <div className="complete-body__list">
        {rows.map((cell) => (
          <CompleteCellRow key={cell.batteryCellId} cell={cell} />
        ))}
      </div>
    </div>
  )
}

function CompleteCellRow({ cell }: { cell: CellProgress }) {
  const navigate = useNavigate()
  const tone =
    cell.finalLabel === 'PASS'
      ? 'pass'
      : cell.finalLabel === 'REJECT'
        ? 'reject'
        : cell.finalLabel === 'FAIL'
          ? 'fail'
          : 'neutral'

  return (
    <button
      type="button"
      className={`complete-body__row complete-body__row--${tone}`}
      onClick={() => navigate(ROUTES.BATTERY_DETAIL(cell.batteryCellId))}
    >
      <span className="complete-body__row-swatch" />
      <span className="complete-body__row-id">CELL-{cell.batteryCellId}</span>
      <span className="complete-body__row-status">{cell.finalLabel ?? cell.status}</span>
      <span className="complete-body__row-batch">Batch #{cell.batchId}</span>
      <svg
        className="complete-body__row-arrow"
        width="9"
        height="16"
        viewBox="0 0 9 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 1L7.24 8L1 15"
          stroke="#9CA3AF"
          strokeWidth="1.63"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </button>
  )
}

export { CompleteBody }
