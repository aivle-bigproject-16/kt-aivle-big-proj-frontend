import { useSimulationStore } from '../store/useSimulationStore'
import { TwinStage } from './twin/TwinStage'
import { SimControl } from './SimControl'
import './Overview.css'

/** 오버뷰 — 헤더 + 디지털 트윈 스테이지 2덩이.
   구 flow 카드 3장(OverviewPending/Capture/Analyze)과 결과 블록(OverviewResult)은
   트윈 스테이지가 통째로 대체한다. 결과는 라인 끝의 배출함 3개가 표시한다 */
function Overview({ onNavigate }: { onNavigate?: (index: number) => void }) {
  const isLive = useSimulationStore((s) => s.simulationStatus === 'running')
  const completedCount = useSimulationStore((s) => s.completed.length)
  const totalCount = useSimulationStore((s) => s.batteryCellCount)
  const passCount = useSimulationStore((s) => s.completed.filter((c) => c.finalLabel === 'PASS').length)
  const passPct = completedCount > 0 ? (passCount / completedCount) * 100 : 0

  return (
    <div className="overview">
      <div className="overview-header">
        <h2 className="overview-header__title">Live Monitoring Flow</h2>

        <div className="overview-header__right">
          {/* 트윈이 표현할 수 없는 두 지표만 헤더에 남긴다 — 나머지는 라인 위에 있다 */}
          <div className="overview-header__readout">
            <span className="overview-header__readout-label">완료</span>
            <span className="overview-header__readout-value">
              {completedCount} / {totalCount}
            </span>
          </div>
          <div className="overview-header__readout">
            <span className="overview-header__readout-label">양품률</span>
            <span className="overview-header__readout-value overview-header__readout-value--pass">
              {passPct.toFixed(1)}%
            </span>
          </div>

          <div className={`overview-header__live${isLive ? '' : ' overview-header__live--off'}`}>
            <span className="overview-header__live-dot" />
            <span className="overview-header__live-text">
              {isLive ? 'LIVE · 연결됨' : 'OFF · 종료됨'}
            </span>
          </div>

          <SimControl />
        </div>
      </div>

      <div className="overview-stage">
        <TwinStage onNavigate={onNavigate} />
      </div>
    </div>
  )
}

export { Overview }
