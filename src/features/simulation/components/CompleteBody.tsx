import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSimulationStore } from '../store/useSimulationStore'
import { ROUTES } from '@/core/navigation/routes'
import type { FinalLabel } from '@/features/battery/types'
import type { CellProgress } from '../types'
import './OverviewResult.css'
import './CompleteBody.css'

type CompleteFilter = 'ALL' | FinalLabel

const TONE_COLOR: Record<string, string> = {
  pass: '#1e7e34',
  reject: '#d97706',
  fail: '#dc2626',
  neutral: '#9ca3af',
}

/** 완료 본문 — 1400×700 흰 카드. 상단은 전체/PASS/REJECT/FAIL 카운트 칩, 아래는
   완료된 셀 목록(최근 완료 순). 리스트는 세로 스크롤. 칩을 클릭하면 해당 상태의
   셀만 필터링해서 보여준다 */
function CompleteBody() {
  const completed = useSimulationStore((s) => s.completed)
  const totalCount = useSimulationStore((s) => s.batteryCellCount)
  const passCount = useMemo(() => completed.filter((c) => c.finalLabel === 'PASS').length, [completed])
  const rejectCount = useMemo(
    () => completed.filter((c) => c.finalLabel === 'REJECT').length,
    [completed],
  )
  const failCount = useMemo(() => completed.filter((c) => c.finalLabel === 'FAIL').length, [completed])
  const completedCount = completed.length
  const passPct = completedCount > 0 ? (passCount / completedCount) * 100 : 0
  const rejectPct = completedCount > 0 ? (rejectCount / completedCount) * 100 : 0
  const failPct = completedCount > 0 ? (failCount / completedCount) * 100 : 0

  const [filter, setFilter] = useState<CompleteFilter>('ALL')

  /* completed 배열은 완료 순서대로 뒤에 추가되므로, 최근 완료된 셀이 위로 오도록 뒤집는다 */
  const rows = useMemo(() => {
    const reversed = [...completed].reverse()
    return filter === 'ALL' ? reversed : reversed.filter((c) => c.finalLabel === filter)
  }, [completed, filter])

  return (
    <div className="complete-body">
      <div className="overview-result__header">
        <div className="overview-result__title-group">
          <span className="overview-result__title">검사 결과</span>
          <span className="overview-result__subtitle">RESULT</span>
        </div>

        <div className="overview-result__stats">
          <div className="overview-result__stat">
            <span className="overview-result__stat-label">완료</span>
            <span className="overview-result__stat-value">
              {completedCount} / {totalCount}
            </span>
          </div>
          <div className="overview-result__stat">
            <span className="overview-result__stat-label">양품률</span>
            <span className="overview-result__stat-value overview-result__stat-value--pass">
              {passPct.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      <div className="overview-result__status-bar">
        <div className="overview-result__status-bar-pass" style={{ width: `${passPct}%` }} />
        <div className="overview-result__status-bar-reject" style={{ width: `${rejectPct}%` }} />
        <div className="overview-result__status-bar-fail" style={{ width: `${failPct}%` }} />
      </div>
      <div className="overview-result__result">
        <ResultStatCard
          tone="all"
          title="전체"
          subtitle="ALL"
          count={completedCount}
          active={filter === 'ALL'}
          onClick={() => setFilter('ALL')}
        />
        <ResultStatCard
          tone="pass"
          title="정상"
          subtitle="PASS"
          count={passCount}
          pct={passPct}
          active={filter === 'PASS'}
          onClick={() => setFilter((f) => (f === 'PASS' ? 'ALL' : 'PASS'))}
        />
        <ResultStatCard
          tone="reject"
          title="불량"
          subtitle="REJECT"
          count={rejectCount}
          pct={rejectPct}
          active={filter === 'REJECT'}
          onClick={() => setFilter((f) => (f === 'REJECT' ? 'ALL' : 'REJECT'))}
        />
        <ResultStatCard
          tone="fail"
          title="검사 실패"
          subtitle="FAIL"
          count={failCount}
          pct={failPct}
          active={filter === 'FAIL'}
          onClick={() => setFilter((f) => (f === 'FAIL' ? 'ALL' : 'FAIL'))}
        />
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
      <CompleteBatteryIcon color={TONE_COLOR[tone]} />
      <span className="complete-body__row-id">CELL-{cell.batteryCellId}</span>
      <span className="complete-body__row-status">{cell.finalLabel ?? cell.status}</span>
      <span className="complete-body__row-batch">Batch #{cell.batchId}</span>
      <svg
        className="complete-body__row-arrow"
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

/* OverviewResult의 스탯 카드와 동일 — 좌측 곡률 0. 클릭하면 해당 상태로 목록을
   필터링한다(같은 카드를 다시 누르면 전체로 돌아온다) */
function ResultStatCard({
  tone,
  title,
  subtitle,
  count,
  pct,
  active,
  onClick,
}: {
  tone: 'all' | 'pass' | 'reject' | 'fail'
  title: string
  subtitle: string
  count: number
  pct?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`overview-result__stat-card overview-result__stat-card--${tone}${active ? ' overview-result__stat-card--active' : ''}`}
      onClick={onClick}
    >
      <span className="overview-result__stat-card-accent" />
      <div className="overview-result__stat-card-left">
        <span className="overview-result__stat-card-title">{title}</span>
        <span className="overview-result__stat-card-subtitle">{subtitle}</span>
      </div>
      <div className="overview-result__stat-card-right">
        <span className="overview-result__stat-card-count">{count}</span>
        {pct !== undefined && <span className="overview-result__stat-card-pct">{pct.toFixed(1)}%</span>}
      </div>
    </button>
  )
}

/* capture-body__cell의 배터리 아이콘과 같은 모양, 색만 상태(tone)에 따라 바뀐다 */
function CompleteBatteryIcon({ color }: { color: string }) {
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

export { CompleteBody }
