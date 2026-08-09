import { useState } from 'react'
import { useSimulationSocket } from '../hooks/useSimulationSocket'
import { SimulationNav } from './SimulationNav'
import { Overview } from './Overview'
import { Pending } from './Pending'
import { Capture } from './Capture'
import { Analyze } from './Analyze'
import { Complete } from './Complete'
import './Simulation.css'

/** 시뮬레이션 전체 — 대시보드의 시뮬레이션 영역 하나를 통째로 나타내는 컴포넌트.
   구 패널들(OverviewPanel/PendingPanel/CapturePanel/AnalyzePanel/CompletePanel/
   KpiCards/ResultSummary/SimNavBar 등)은 history/로 이관됨 — 1400 기준으로 새로 만들 것 */
function Simulation() {
  useSimulationSocket()
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="simulation">
      <SimulationNav activeIndex={activeIndex} onChange={setActiveIndex} />
      {activeIndex === 0 && <Overview />}
      {activeIndex === 1 && <Pending />}
      {activeIndex === 2 && <Capture />}
      {activeIndex === 3 && <Analyze />}
      {activeIndex === 4 && <Complete />}
    </div>
  )
}

export { Simulation }
