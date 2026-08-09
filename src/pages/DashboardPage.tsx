import { Simulation } from '@/features/simulation'
// 1200 기준 구 CSS는 history/DashboardPage.css로 이동됨 — 1400 기준으로 새로 만들 것

function DashboardPage() {
  return (
    <div className="dashboard">
      <Simulation />
    </div>
  )
}

export default DashboardPage
