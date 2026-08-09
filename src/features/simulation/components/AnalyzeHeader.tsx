import { useSimulationStore } from '../store/useSimulationStore'
import { SimControl } from './SimControl'
import './AnalyzeHeader.css'

/** 분석 헤더 — 대기/촬영 헤더와 동일한 형태(1400×100, 곡률 1rem). 내부 영역이 가로로 정렬된다:
   text / 셀 ID / 배치 / 모델, 오른쪽 끝에 status + SimControl */
function AnalyzeHeader() {
  const analyzeCellId = useSimulationStore((s) => s.analyze?.batteryCellId)
  const analyzeBatchId = useSimulationStore((s) => s.analyze?.batchId)
  const isLive = useSimulationStore((s) => s.simulationStatus === 'running')

  return (
    <div className="analyze-header">
      <div className="analyze-header__text">
        <span className="analyze-header__dot" />
        <div className="analyze-header__text-labels">
          <span className="analyze-header__label-main">분석</span>
          <span className="analyze-header__label-sub">ANALYSIS</span>
        </div>
      </div>

      <span className="analyze-header__divider" />

      <div className="analyze-header__cell">
        <span className="analyze-header__field-label">셀 ID</span>
        <span className="analyze-header__cell-value">
          {analyzeCellId !== undefined ? `CELL-${analyzeCellId}` : '-'}
        </span>
      </div>

      <span className="analyze-header__divider" />

      <div className="analyze-header__batch">
        <span className="analyze-header__field-label">배치</span>
        <span className="analyze-header__field-value">
          {analyzeBatchId !== undefined ? `#${analyzeBatchId}` : '-'}
        </span>
      </div>

      <span className="analyze-header__divider" />

      <div className="analyze-header__model">
        <span className="analyze-header__field-label">모델</span>
        <span className="analyze-header__field-value">YOLOv11-seg</span>
      </div>

      <div className="analyze-header__spacer" />

      <div className={`analyze-header__status${isLive ? '' : ' analyze-header__status--off'}`}>
        <span className="analyze-header__status-dot" />
        <span className="analyze-header__status-text">
          {isLive ? 'LIVE · 연결됨' : 'OFF · 종료됨'}
        </span>
      </div>

      <SimControl />
    </div>
  )
}

export { AnalyzeHeader }
