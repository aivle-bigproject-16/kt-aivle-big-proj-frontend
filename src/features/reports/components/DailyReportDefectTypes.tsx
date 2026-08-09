import { useMemo } from 'react'
import { useDailyReportDetailStore } from '../store/useDailyReportDetailStore'
import type { DefectStat } from '../types'
import './DailyReportDefectTypes.css'

const DEFECT_TYPE_LABEL: Record<string, string> = {
  MICRO_DEFECT: '미세결함',
  CRACK: '갈라짐',
  SPOT: '오점',
}

/** 결함 유형 분포 카드 — 869×367. 결함 유형별 건수/비율을 막대로 보여준다 */
function DailyReportDefectTypes() {
  const defects = useDailyReportDetailStore((s) => s.detail?.summary.defects ?? [])
  const total = useMemo(() => defects.reduce((sum, d) => sum + d.count, 0), [defects])

  return (
    <div className="daily-report-defect-types">
      <div className="daily-report-defect-types__header">
        <span className="daily-report-defect-types__title">결함 유형 분포</span>
        <span className="daily-report-defect-types__subtitle">DEFECT TYPES</span>
        <span className="daily-report-defect-types__total">총 {total.toLocaleString()}건</span>
      </div>

      <span className="daily-report-defect-types__divider" />

      {defects.length === 0 ? (
        <p className="daily-report-defect-types__empty">결함 유형 데이터가 없습니다.</p>
      ) : (
        <div className="daily-report-defect-types__list">
          {defects.map((d) => (
            <DefectRow key={d.defectType} defect={d} total={total} />
          ))}
        </div>
      )}
    </div>
  )
}

function DefectRow({ defect, total }: { defect: DefectStat; total: number }) {
  const pct = total > 0 ? (defect.count / total) * 100 : 0
  return (
    <div className="daily-report-defect-types__row">
      <div className="daily-report-defect-types__row-top">
        <span className="daily-report-defect-types__row-title">
          {DEFECT_TYPE_LABEL[defect.defectType] ?? defect.defectType}
        </span>
        <span className="daily-report-defect-types__row-code">{defect.defectType}</span>
        <span className="daily-report-defect-types__row-spacer" />
        <span className="daily-report-defect-types__row-count">{defect.count}</span>
        <span className="daily-report-defect-types__row-pct">{pct.toFixed(1)}%</span>
      </div>
      <div className="daily-report-defect-types__bar">
        <div className="daily-report-defect-types__bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export { DailyReportDefectTypes }
