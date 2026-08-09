import { useSimulationStore } from '../store/useSimulationStore'
import { SimControl } from './SimControl'
import './CompleteHeader.css'

/** 완료 헤더 — 대기/촬영/분석 헤더와 동일한 형태(1400×100, 곡률 1rem). 내부 영역이 가로로 정렬된다:
   text / 완료(카운트) / 양품률, 오른쪽 끝에 status + SimControl */
function CompleteHeader() {
  const completedCount = useSimulationStore((s) => s.completed.length)
  const totalCount = useSimulationStore((s) => s.batteryCellCount)
  const passCount = useSimulationStore(
    (s) => s.completed.filter((c) => c.finalLabel === 'PASS').length,
  )
  const passPct = completedCount > 0 ? (passCount / completedCount) * 100 : 0
  const isLive = useSimulationStore((s) => s.simulationStatus === 'running')

  return (
    <div className="complete-header">
      <div className="complete-header__text">
        <span className="complete-header__dot" />
        <div className="complete-header__text-labels">
          <span className="complete-header__label-main">완료</span>
          <span className="complete-header__label-sub">COMPLETE</span>
        </div>
      </div>

      <span className="complete-header__divider" />

      <div className="complete-header__count">
        <span className="complete-header__field-label">완료 셀</span>
        <div className="complete-header__count-value-row">
          <span className="complete-header__count-value">{completedCount}</span>
          <span className="complete-header__count-total">/ {totalCount}</span>
        </div>
      </div>

      <span className="complete-header__divider" />

      <div className="complete-header__rate">
        <span className="complete-header__field-label">양품률</span>
        <span className="complete-header__rate-value">{passPct.toFixed(1)}%</span>
      </div>

      <div className="complete-header__spacer" />

      <div className={`complete-header__status${isLive ? '' : ' complete-header__status--off'}`}>
        <span className="complete-header__status-dot" />
        <span className="complete-header__status-text">
          {isLive ? 'LIVE · 연결됨' : 'OFF · 종료됨'}
        </span>
      </div>

      <SimControl />
    </div>
  )
}

export { CompleteHeader }
