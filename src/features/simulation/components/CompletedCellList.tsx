import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/core/navigation/routes'
import type { CellProgress } from '../types'
import './CompletedCellList.css'

const TONE_COLOR: Record<string, string> = {
  pass: '#1e7e34',
  reject: '#d97706',
  fail: '#dc2626',
  neutral: '#9ca3af',
}

/** 완료된 셀 목록 — 완료 탭(CompleteBody)과 오버뷰 결과 카드(OverviewResult)가
   공용으로 쓰는 셀 리스트. 넘치면 세로 스크롤, 하단은 은은하게 페이드 */
function CompletedCellList({ cells }: { cells: CellProgress[] }) {
  return (
    <div className="completed-cell-list">
      {cells.map((cell) => (
        <CompletedCellRow key={cell.batteryCellId} cell={cell} />
      ))}
    </div>
  )
}

function CompletedCellRow({ cell }: { cell: CellProgress }) {
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
      className={`completed-cell-list__row completed-cell-list__row--${tone}`}
      onClick={() => navigate(ROUTES.BATTERY_DETAIL(cell.batteryCellId))}
    >
      <CompletedCellIcon color={TONE_COLOR[tone]} />
      <span className="completed-cell-list__row-id">CELL-{cell.batteryCellId}</span>
      <span className="completed-cell-list__row-status">{cell.finalLabel ?? cell.status}</span>
      <span className="completed-cell-list__row-batch">Batch #{cell.batchId}</span>
      <svg
        className="completed-cell-list__row-arrow"
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

/* capture-body__cell의 배터리 아이콘과 같은 모양, 색만 상태(tone)에 따라 바뀐다 */
function CompletedCellIcon({ color }: { color: string }) {
  return (
    <svg style={{ width: '1.7rem', height: '3.1rem' }} viewBox="0 0 17 31" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.0371 0L5.7514 0C5.35691 0 5.03711 0.319799 5.03711 0.714292L5.03711 1.42858C5.03711 1.82308 5.35691 2.14288 5.7514 2.14288L10.0371 2.14288C10.4316 2.14288 10.7514 1.82308 10.7514 1.42858V0.714292C10.7514 0.319799 10.4316 0 10.0371 0Z"
        fill="#94A3B8"
      />
      <path
        d="M14.25 2L2.25 2C1.42157 2 0.75 2.64287 0.75 3.4359L0.75 28.5641C0.75 29.3571 1.42157 30 2.25 30H14.25C15.0784 30 15.75 29.3571 15.75 28.5641L15.75 3.4359C15.75 2.64287 15.0784 2 14.25 2Z"
        stroke={color}
        strokeWidth="1.5"
      />
      <rect x="2.75" y="4" width="11" height="24" fill={color} />
    </svg>
  )
}

export { CompletedCellList }
