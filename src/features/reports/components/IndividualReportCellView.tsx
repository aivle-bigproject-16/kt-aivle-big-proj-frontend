import { useMemo } from 'react'
import { useIndividualReportDetailStore } from '../store/useIndividualReportDetailStore'
import type { ImageMapping } from '../types'
import { Cell3DCanvas } from './Cell3DView'
import './IndividualReportCellView.css'

/* 셀렉터 안에서 `?? []`로 새 배열을 만들면 매 호출마다 참조가 달라져 getSnapshot
   무한 루프가 난다 — 셀렉터는 원본(undefined일 수 있음)만 반환하고, 폴백은 이
   모듈 스코프 상수로 컴포넌트 밖에서 처리한다 */
const EMPTY_MAPPINGS: ImageMapping[] = []

/** 셀 3D 뷰 카드 — 869×403 흰 카드. imageMappings의 axis별(x/y/z) CT bbox를 교차시켜
   결함 영역을 재구성한 뒤 Cell3DCanvas로 그리고, 하단에 "CELL ID · 영역 N개" 캡션을 붙인다 */
function IndividualReportCellView() {
  const imageMappings = useIndividualReportDetailStore((s) => s.detail?.imageMappings) ?? EMPTY_MAPPINGS
  const batteryCellId = useIndividualReportDetailStore((s) => s.detail?.batteryCellId)

  const ctMappings = useMemo(() => imageMappings.filter((m) => m.imageType === 'CT'), [imageMappings])
  const hasAxisData = ctMappings.some((m) => m.axis)

  return (
    <div className="individual-report-cellview">
      <div className="individual-report-cellview__header">
        <span className="individual-report-cellview__title">셀 3D 뷰</span>
        <span className="individual-report-cellview__subtitle">Cell 3D View</span>
        <span className="individual-report-cellview__hint">드래그로 회전 · 휠로 확대</span>
      </div>

      <div className="individual-report-cellview__canvas">
        {hasAxisData && <Cell3DCanvas mappings={ctMappings} />}
      </div>

      {batteryCellId !== undefined && (
        <span className="individual-report-cellview__caption">
          CELL ID {batteryCellId} · 영역 {imageMappings.length}개
        </span>
      )}
    </div>
  )
}

export { IndividualReportCellView }
