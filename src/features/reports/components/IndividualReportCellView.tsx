import { useIndividualReportDetailStore } from '../store/useIndividualReportDetailStore'
import { Cell3DCanvas } from './Cell3DView'
import './IndividualReportCellView.css'

/** 셀 3D 뷰 카드 — 869×403 흰 카드. 검은 캔버스 안에 Cell3DCanvas(점군 시각화)를 넣고,
   하단에 "cellId · 영역 N개" 캡션을 붙인다 */
function IndividualReportCellView() {
  const cellView = useIndividualReportDetailStore((s) => s.cellView)
  const bboxCount = useIndividualReportDetailStore((s) => s.detail?.imageMappings.length ?? 0)

  return (
    <div className="individual-report-cellview">
      <div className="individual-report-cellview__header">
        <span className="individual-report-cellview__title">셀 3D 뷰</span>
        <span className="individual-report-cellview__subtitle">CELL 3D VIEW</span>
        <span className="individual-report-cellview__hint">드래그로 회전 · 휠로 확대</span>
      </div>

      <div className="individual-report-cellview__canvas">
        {cellView && <Cell3DCanvas data={cellView} />}
      </div>

      {cellView && (
        <span className="individual-report-cellview__caption">
          CELL ID {cellView.cellId} · 영역 {bboxCount}개
        </span>
      )}
    </div>
  )
}

export { IndividualReportCellView }
