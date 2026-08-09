import { useIndividualReportDetailStore } from '../store/useIndividualReportDetailStore'
import './IndividualReportMetrics.css'

/* 결함 지표 카드 — 위험도/패턴/주요 구역은 아직 스토어에 없어 적당한 예시 값으로 채워둔다.
   결함 수는 전체 bbox 개수(실측), 불량 이미지 비율은 분모(전체 이미지 수)가 아직
   스토어에 없어 0으로 두고 (스토어 필요)로 표시한다 */
function IndividualReportMetrics() {
  const defectCount = useIndividualReportDetailStore((s) => s.detail?.imageMappings.length ?? 0)

  return (
    <div className="individual-report-metrics">
      <div className="individual-report-metrics__header">
        <span className="individual-report-metrics__title">결함 지표</span>
        <span className="individual-report-metrics__subtitle">METRICS (스토어 필요)</span>
      </div>

      <div className="individual-report-metrics__chips">
        <span className="individual-report-metrics__chip individual-report-metrics__chip--risk">
          위험도 높음
        </span>
        <span className="individual-report-metrics__chip individual-report-metrics__chip--pattern">
          국부 군집형
        </span>
      </div>

      <span className="individual-report-metrics__divider" />

      <div className="individual-report-metrics__stats">
        <div className="individual-report-metrics__stat">
          <span className="individual-report-metrics__stat-label">불량 이미지 비율</span>
          <span className="individual-report-metrics__stat-value-row">
            <span className="individual-report-metrics__stat-value">0</span>
            <span className="individual-report-metrics__stat-unit">%(스토어 필요)</span>
          </span>
        </div>
        <div className="individual-report-metrics__stat individual-report-metrics__stat--right">
          <span className="individual-report-metrics__stat-label">결함 수</span>
          <span className="individual-report-metrics__stat-value-row">
            <span className="individual-report-metrics__stat-value">{defectCount}</span>
            <span className="individual-report-metrics__stat-unit">개</span>
          </span>
        </div>
      </div>

      <span className="individual-report-metrics__divider" />
      <div className="individual-report-metrics__zones">
        <ZoneRow tone="fail" title="상단 중앙부" note="군집 밀도가 가장 높은 구간" />
        <ZoneRow tone="reject" title="좌측 하단" note="산발적 저신뢰 검출" />
      </div>
    </div>
  )
}

function ZoneRow({ tone, title, note }: { tone: 'fail' | 'reject'; title: string; note: string }) {
  return (
    <div className={`individual-report-metrics__zone individual-report-metrics__zone--${tone}`}>
      <span className="individual-report-metrics__zone-accent" />
      <div className="individual-report-metrics__zone-text">
        <span className="individual-report-metrics__zone-title">{title}</span>
        <span className="individual-report-metrics__zone-note">{note}</span>
      </div>
    </div>
  )
}

export { IndividualReportMetrics }
