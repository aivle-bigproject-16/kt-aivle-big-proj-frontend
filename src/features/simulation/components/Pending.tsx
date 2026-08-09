import { PendingHeader } from './PendingHeader'
import { PendingBody } from './PendingBody'
import './Pending.css'

/** 대기 탭 — 시뮬레이션 네비게이션의 "대기" 탭에서 보여주는 패널 */
function Pending() {
  return (
    <div className="pending">
      <PendingHeader />
      <PendingBody />
    </div>
  )
}

export { Pending }
