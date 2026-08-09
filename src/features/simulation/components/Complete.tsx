import { CompleteHeader } from './CompleteHeader'
import { CompleteBody } from './CompleteBody'
import './Complete.css'

/** 완료 탭 — 시뮬레이션 네비게이션의 "완료" 탭에서 보여주는 패널. Pending.tsx와 동일한 형태 */
function Complete() {
  return (
    <div className="complete">
      <CompleteHeader />
      <CompleteBody />
    </div>
  )
}

export { Complete }
