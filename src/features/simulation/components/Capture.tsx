import { CaptureHeader } from './CaptureHeader'
import { CaptureBody } from './CaptureBody'
import './Capture.css'

/** 촬영 탭 — 시뮬레이션 네비게이션의 "촬영" 탭에서 보여주는 패널. Pending.tsx와 동일한 형태 */
function Capture() {
  return (
    <div className="capture">
      <CaptureHeader />
      <CaptureBody />
    </div>
  )
}

export { Capture }
