import { useDailyReportDetailStore } from '../store/useDailyReportDetailStore'
import './DailyReportStatCards.css'

/** 검사 통계 카드 4개 — 총 검사 수 / 정상 PASS / 불량 REJECT / 검사 실패 FAIL. 가로 배치 */
function DailyReportStatCards() {
  const summary = useDailyReportDetailStore((s) => s.detail?.summary)
  const totalCount = summary?.totalCount ?? 0
  const passCount = summary?.passCount ?? 0
  const rejectCount = summary?.rejectCount ?? 0
  const failedCount = summary?.failedCount ?? 0
  const pct = (n: number) => (totalCount > 0 ? (n / totalCount) * 100 : 0)

  return (
    <div className="daily-report-stat-cards">
      <StatCard tone="neutral" label="총 검사 수" value={totalCount.toLocaleString()} unit="건" />
      <StatCard
        tone="pass"
        label="정상 PASS"
        value={passCount.toLocaleString()}
        pct={pct(passCount)}
      />
      <StatCard
        tone="reject"
        label="불량 REJECT"
        value={rejectCount.toLocaleString()}
        pct={pct(rejectCount)}
      />
      <StatCard
        tone="fail"
        label="검사 실패 FAIL"
        value={failedCount.toLocaleString()}
        pct={pct(failedCount)}
      />
    </div>
  )
}

function StatCard({
  tone,
  label,
  value,
  unit,
  pct,
}: {
  tone: 'neutral' | 'pass' | 'reject' | 'fail'
  label: string
  value: string
  unit?: string
  pct?: number
}) {
  return (
    <div className={`daily-report-stat-card daily-report-stat-card--${tone}`}>
      {tone !== 'neutral' && <span className="daily-report-stat-card__accent" />}
      <span className="daily-report-stat-card__label">{label}</span>
      <div className="daily-report-stat-card__value-row">
        <span className="daily-report-stat-card__value">{value}</span>
        {unit && <span className="daily-report-stat-card__unit">{unit}</span>}
        {pct !== undefined && <span className="daily-report-stat-card__pct">{pct.toFixed(1)}%</span>}
      </div>
    </div>
  )
}

export { DailyReportStatCards }
