import { useMemo, useState } from 'react'
import { useSimulationStore } from '../store/useSimulationStore'
import type { FinalLabel } from '@/features/battery/types'
import { CompletedCellList } from './CompletedCellList'
import './OverviewResult.css'
import './CompleteBody.css'

type CompleteFilter = 'ALL' | FinalLabel

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
        <div className="complete-body__stat-row">
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

        <CompletedCellList cells={rows} />
      </div>
    </div>
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

export { CompleteBody }
