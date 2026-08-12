import { useMemo } from 'react'
import { useSimulationStore } from '../store/useSimulationStore'
import { CompletedCellList } from './CompletedCellList'
import './OverviewResult.css'

/** 오버뷰 리절트 — 카드 행 하단, 1400 폭 고정, 흰 배경. 내부는 4개 영역이
   세로로 정렬된다: 헤더 / 스테이터스바 / 리절트 / 완료된 셀 목록 */
function OverviewResult() {
  const completed = useSimulationStore((s) => s.completed)
  const orderedCompleted = useSimulationStore((s) => s.completedOrdered)
  const totalCount = useSimulationStore((s) => s.batteryCellCount)
  const completedCount = completed.length
  const passCount = useMemo(() => completed.filter((c) => c.finalLabel === 'PASS').length, [completed])
  const rejectCount = useMemo(() => completed.filter((c) => c.finalLabel === 'REJECT').length, [completed])
  const failCount = useMemo(() => completed.filter((c) => c.finalLabel === 'FAIL').length, [completed])
  const passPct = completedCount > 0 ? (passCount / completedCount) * 100 : 0
  const rejectPct = completedCount > 0 ? (rejectCount / completedCount) * 100 : 0
  const failPct = completedCount > 0 ? (failCount / completedCount) * 100 : 0

  /* 배열을 직접 뒤집지 않는다 — completed 의 정렬 방향은 계약에 규정돼 있지 않고,
     스토어가 관측으로 알아낸 정규 순서(최근 완료가 앞)를 이미 발행하고 있다 */
  const rows = orderedCompleted

  return (
    <div className="overview-result">
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
          tone="pass"
          title="정상"
          subtitle="PASS"
          count={passCount}
          pct={passPct}
        />
        <ResultStatCard
          tone="reject"
          title="불량"
          subtitle="REJECT"
          count={rejectCount}
          pct={rejectPct}
        />
        <ResultStatCard
          tone="fail"
          title="검사 실패"
          subtitle="FAIL"
          count={failCount}
          pct={failPct}
        />
      </div>

      <CompletedCellList cells={rows} />
    </div>
  )
}

function ResultStatCard({
  tone,
  title,
  subtitle,
  count,
  pct,
}: {
  tone: 'pass' | 'reject' | 'fail'
  title: string
  subtitle: string
  count: number
  pct: number
}) {
  return (
    <div className={`overview-result__stat-card overview-result__stat-card--${tone}`}>
      <span className="overview-result__stat-card-accent" />
      <div className="overview-result__stat-card-left">
        <span className="overview-result__stat-card-title">{title}</span>
        <span className="overview-result__stat-card-subtitle">{subtitle}</span>
      </div>
      <div className="overview-result__stat-card-right">
        <span className="overview-result__stat-card-count">{count}</span>
        <span className="overview-result__stat-card-pct">{pct.toFixed(1)}%</span>
      </div>
    </div>
  )
}

export { OverviewResult }
