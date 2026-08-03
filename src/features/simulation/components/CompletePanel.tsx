import { useMemo } from 'react'
import { useSimulationStore } from '../store/useSimulationStore'
import type { CellProgress } from '../types'
import { BatteryCellIcon } from './BatteryCellIcon'
import './CompletePanel.css'

type FinalGroup = 'PASS' | 'REJECT' | 'FAIL'

const GROUP_CONFIG: Record<FinalGroup, { color: string }> = {
  PASS: { color: '#2ECC71' },
  REJECT: { color: '#F15353' },
  FAIL: { color: '#873C3E' },
}

function SubCard({ group, cells }: { group: FinalGroup; cells: CellProgress[] }) {
  const { color } = GROUP_CONFIG[group]
  return (
    <div className="complete-sub">
      <div className="complete-sub__header" style={{ backgroundColor: color }}>
        <span className="complete-sub__title">{group}</span>
        <span className="complete-sub__count">{cells.length} cells</span>
      </div>
      <div className="complete-sub__cells">
        {cells.map(cell => (
          <div key={cell.batteryCellId} className="complete-cell">
            <BatteryCellIcon width="100%" height="100%" color={color} />
            <span className="complete-cell__id">{cell.batteryCellId}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CompletePanel() {
  const completed = useSimulationStore(s => s.completed)
  const today = new Date().toISOString().slice(0, 10)
  const groups = useMemo(() => {
    const pass: CellProgress[] = []
    const reject: CellProgress[] = []
    const fail: CellProgress[] = []
    for (let i = completed.length - 1; i >= 0; i--) {
      const cell = completed[i]
      if (cell.finalLabel === 'PASS') pass.push(cell)
      else if (cell.finalLabel === 'REJECT') reject.push(cell)
      else if (cell.finalLabel === 'FAIL') fail.push(cell)
    }
    return { pass, reject, fail }
  }, [completed])

  return (
    <div className="complete-panel">
      <div className="complete-card">
        <div className="complete-card__header">
          <p className="complete-card__title">COMPLETE Section</p>
          <p className="complete-card__subtitle">셀 분석 완료 영역 {today}</p>
        </div>
        <div className="complete-card__panels">
          <SubCard group="PASS" cells={groups.pass} />
          <SubCard group="REJECT" cells={groups.reject} />
          <SubCard group="FAIL" cells={groups.fail} />
        </div>
      </div>
    </div>
  )
}
