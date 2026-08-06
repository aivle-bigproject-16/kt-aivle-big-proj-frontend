import './KpiCards.css'
import { KpiCard } from './KpiCard'
import { useSimulationStore } from '../store/useSimulationStore'
import { PROCESS_STATUS_DOT, PROCESS_STATUS_LABEL, useProcessStatus } from '../hooks/useProcessStatus'

function KpiCards() {
  const completed = useSimulationStore((s) => s.completed)
  const batteryCellCount = useSimulationStore((s) => s.batteryCellCount)
  const processStatus = useProcessStatus()

  const totalInspections = batteryCellCount
  const passCount = completed.filter((c) => c.finalLabel === 'PASS').length
  const yieldRate =
    completed.length === 0 ? 0 : Math.round((passCount / completed.length) * 1000) / 10

  return (
    <div className="kpi-cards">
      <KpiCard
        title="Process Status"
        subtitle="공정 상태"
        value={PROCESS_STATUS_LABEL[processStatus]}
        dotColor={PROCESS_STATUS_DOT[processStatus]}
      />
      <KpiCard
        title="Total Inspections"
        subtitle="총 검사 수"
        value={totalInspections}
        format={(n) => n.toLocaleString()}
        unit="units"
      />
      <KpiCard
        title="Yield Rate"
        subtitle="양품률"
        value={yieldRate}
        decimals={1}
        format={(n) => (n === 100 ? '100' : n.toFixed(1))}
        suffix="%"
        unit="target 99%"
        accent
        yieldLayout
      />
    </div>
  )
}

export { KpiCards }
