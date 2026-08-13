import { useMemo } from 'react'
import { useDailyReportDetailStore } from '../store/useDailyReportDetailStore'
import type { DefectStat } from '../types'
import { DEFECT_TYPE_LABEL } from '@/shared/utils/defectTypeLabel'
import './DailyReportDefectTypes.css'

/* 모듈 스코프 상수 — 셀렉터 안에서 매번 새 []를 만들면(예: `s.detail?.x ?? []`) 참조가
   매 호출마다 달라져 getSnapshot 무한 루프(Maximum update depth exceeded)가 난다.
   detail이 null인 첫 렌더에서만 문제가 되므로 데이터가 채워진 뒤에는 재현되지 않는다 */
const EMPTY_DEFECTS: DefectStat[] = []

/** 결함 유형 분포 카드 — 869×367. 결함 유형별 건수/비율을 막대로 보여준다 */
function DailyReportDefectTypes() {
  const detail = useDailyReportDetailStore((s) => s.detail)
  const defects = detail?.summary?.defects ?? EMPTY_DEFECTS
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
