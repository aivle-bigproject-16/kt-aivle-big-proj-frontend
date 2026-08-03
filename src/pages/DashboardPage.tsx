import { useState } from 'react'
import { Simulation, KpiCards, ResultSummary, SimNavBar, PendingPanel, CapturePanel, AnalyzePanel, CompletePanel, useSimulationSocket } from '@/features/simulation'
import './DashboardPage.css'

function DashboardPage() {
  useSimulationSocket()
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="dashboard">
      <div className="dashboard__sim-nav">
        <SimNavBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="dashboard__simulation">
        <div
          className="dashboard__panels"
          style={{ transform: `translateX(calc(${activeTab} * -140rem))` }}
        >
          <div className="dashboard__panel"><PendingPanel active={activeTab === 0} /></div>
          <div className="dashboard__panel"><CapturePanel active={activeTab === 1} /></div>
          <div className="dashboard__panel"><AnalyzePanel /></div>
          <div className="dashboard__panel"><CompletePanel /></div>
        </div>
      </div>

      <div className="dashboard__kpi">
        <KpiCards />
      </div>

      <div className="dashboard__result">
        <ResultSummary />
      </div>
    </div>
  )
}

export default DashboardPage
