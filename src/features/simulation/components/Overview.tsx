import { useSimulationStore } from '../store/useSimulationStore'
import { useOverviewView } from '../hooks/useOverviewView'
import { OverviewViewToggle } from './OverviewViewToggle'
import { TwinStage } from './twin/TwinStage'
import { DetectionStrip } from './DetectionStrip'
import { RecentCompletedPanel } from './RecentCompletedPanel'
import { OverviewPending } from './OverviewPending'
import { OverviewCapture } from './OverviewCapture'
import { OverviewAnalyze } from './OverviewAnalyze'
import { OverviewArrow } from './OverviewArrow'
import { OverviewResult } from './OverviewResult'
import { SimControl } from './SimControl'
import './Overview.css'

/**
 * 오버뷰 — 헤더 + 본문. 본문은 두 형태 중 하나로 그려진다.
 *
 * `line` (기본) — 디지털 트윈 공정 라인 + 탐지/최근 완료 인사이트 행.
 * `card` — 구 요약 카드 3장 + 검사 결과 블록.
 *
 * 두 형태가 같은 데이터를 다르게 보여줄 뿐이라 헤더는 공유한다. 다만 완료 수와
 * 양품률은 카드 뷰에서 검사 결과 블록이 이미 크게 표시하므로 헤더에서 뺀다 —
 * 한 화면에 같은 수치를 두 번 그리지 않는다 (DASHBOARD_REDESIGN.md §2.4).
 * 그래서 리드아웃은 좌측에 두어, 사라져도 우측 컨트롤 자리가 움직이지 않게 한다.
 */
function Overview({ onNavigate }: { onNavigate?: (index: number) => void }) {
  const { view, changeView } = useOverviewView()

  const isLive = useSimulationStore((s) => s.simulationStatus === 'running')
  const completedCount = useSimulationStore((s) => s.completed.length)
  const totalCount = useSimulationStore((s) => s.batteryCellCount)
  const passCount = useSimulationStore((s) => s.completed.filter((c) => c.finalLabel === 'PASS').length)
  const passPct = completedCount > 0 ? (passCount / completedCount) * 100 : 0

  return (
    <div className="overview">
      <div className="overview-header">
        {/* 리드아웃은 좌측 그룹에 둔다. 우측에 두면 카드 뷰에서 사라질 때 그룹 폭이
           줄어 토글이 옆으로 밀린다 — 뷰를 오갈 때 토글 자리가 흔들리면 안 된다 */}
        <div className="overview-header__left">
          <h2 className="overview-header__title">Live Monitoring Flow</h2>

          {view === 'line' && (
            <div className="overview-header__readouts">
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
            </div>
          )}
        </div>

        <div className="overview-header__right">
          <OverviewViewToggle view={view} onChange={changeView} />

          <div className={`overview-header__live${isLive ? '' : ' overview-header__live--off'}`}>
            <span className="overview-header__live-dot" />
            <span className="overview-header__live-text">
              {isLive ? 'LIVE · 연결됨' : 'OFF · 종료됨'}
            </span>
          </div>

          <SimControl />
        </div>
      </div>

      {view === 'line' ? (
        <>
          <div className="overview-stage">
            <TwinStage onNavigate={onNavigate} />
          </div>

          <div className="overview-insights">
            <DetectionStrip />
            <RecentCompletedPanel />
          </div>
        </>
      ) : (
        <>
          {/* 카드 사이 간격 7rem — 카드/화살표를 0.5rem gap으로 나열해
             화살표(6rem) 양옆에 0.5rem씩 붙어 카드 사이 총 7rem이 되게 한다 */}
          <div className="overview-cards">
            <OverviewPending onClick={() => onNavigate?.(1)} />
            <OverviewArrow />
            <OverviewCapture onClick={() => onNavigate?.(2)} />
            <OverviewArrow />
            <OverviewAnalyze onClick={() => onNavigate?.(3)} />
          </div>

          <OverviewResult />
        </>
      )}
    </div>
  )
}

export { Overview }
