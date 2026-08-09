import { useSimulationStore } from '../store/useSimulationStore'
import './OverviewArrow.css'

/** 카드 사이를 잇는 화살표 — 40×12 고정. 점선이 오른쪽(화살촉 방향)으로 흐르는 것처럼 보이게 한다.
   시뮬레이션이 러닝 중이 아니면 애니메이션 정지 */
function OverviewArrow() {
  const isRunning = useSimulationStore((s) => s.simulationStatus === 'running')

  return (
    <svg
      className="overview-arrow"
      width="40"
      height="12"
      viewBox="0 0 40 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className={`overview-arrow__dash${isRunning ? '' : ' overview-arrow__dash--paused'}`}
        d="M0 5.99951H27.5"
        stroke="#13777C"
        strokeWidth="1.7497"
        strokeDasharray="5.83 5.83"
      />
      <path className="overview-arrow__head" d="M27.5 0L40 6L27.5 12V0Z" fill="#13777C" />
    </svg>
  )
}

export { OverviewArrow }
