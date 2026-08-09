import { AnalyzeHeader } from './AnalyzeHeader'
import { AnalyzeBody } from './AnalyzeBody'
import './Analyze.css'

/** 분석 탭 — 시뮬레이션 네비게이션의 "분석" 탭에서 보여주는 패널. Pending.tsx와 동일한 형태 */
function Analyze() {
  return (
    <div className="analyze">
      <AnalyzeHeader />
      <AnalyzeBody />
    </div>
  )
}

export { Analyze }
