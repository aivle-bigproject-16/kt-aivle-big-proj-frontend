import { useSimulationStore } from '../store/useSimulationStore'
import { OverviewPending } from './OverviewPending'
import { OverviewCapture } from './OverviewCapture'
import { OverviewAnalyze } from './OverviewAnalyze'
import { OverviewArrow } from './OverviewArrow'
import { OverviewResult } from './OverviewResult'
import { SimControl } from './SimControl'
import './Overview.css'

/** 오버뷰 헤더 — 1404×49 고정. 좌: 타이틀, 우: LIVE 배지 + Sim Control 버튼 */
function Overview() {
  const isLive = useSimulationStore((s) => s.simulationStatus === 'running')

  return (
    <div className="overview">
      <div className="overview-header">
        <h2 className="overview-header__title">Live Monitoring Flow</h2>

        <div className="overview-header__right">
          <div className={`overview-header__live${isLive ? '' : ' overview-header__live--off'}`}>
            <span className="overview-header__live-dot" />
            <span className="overview-header__live-text">
              {isLive ? 'LIVE · 연결됨' : 'OFF · 종료됨'}
            </span>
          </div>

          <SimControl />
        </div>
      </div>

      {/* 카드 사이 간격 7rem — 카드/화살표 모두 0.5rem gap으로 나열해
         화살표(6rem) 양옆에 0.5rem씩 붙어 카드 사이 총 7rem이 되게 한다 */}
      <div className="overview-cards">
        <OverviewPending />
        <OverviewArrow />
        <OverviewCapture />
        <OverviewArrow />
        <OverviewAnalyze />
      </div>

      <OverviewResult />
    </div>
  )
}

export { Overview }
