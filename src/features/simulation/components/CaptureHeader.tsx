import { useSimulationStore } from '../store/useSimulationStore'
import { SimControl } from './SimControl'
import './CaptureHeader.css'

/** 촬영 헤더 — PendingHeader와 동일한 형태, text 영역만 촬영/CAPTURING으로 바꿈.
   1400×100 고정, 곡률 1rem. 내부 6개 영역이 가로로 정렬된다:
   text / units / total / current batch / next batch / status */
function CaptureHeader() {
  /* 촬영 중 — capture 배열에서 CAPTURING 상태인 셀 개수 (OverviewCapture와 동일 패턴) */
  const capturingCount = useSimulationStore(
    (s) => s.capture.filter((c) => c.status === 'CAPTURING').length,
  )
  /* 촬영 완료 — 누적 캡쳐드 개수. CAPTURED로 남은 것 + analyze 중인 셀 + completed된 셀까지 합산 */
  const capturedInCaptureArray = useSimulationStore(
    (s) => s.capture.filter((c) => c.status === 'CAPTURED').length,
  )
  const analyzingCount = useSimulationStore((s) => (s.analyze ? 1 : 0))
  const completedCount = useSimulationStore((s) => s.completed.length)
  const cumulativeCapturedCount = capturedInCaptureArray + analyzingCount + completedCount
  /* 촬영 속도 — 스토어의 captureSpeed(초) */
  const captureSpeed = useSimulationStore((s) => s.captureSpeed)
  /* 현재 배치 — capture 배열에서 CAPTURING 상태 셀의 배치 id */
  const capturingBatchId = useSimulationStore(
    (s) => s.capture.find((c) => c.status === 'CAPTURING')?.batchId,
  )
  const isLive = useSimulationStore((s) => s.simulationStatus === 'running')

  return (
    <div className="capture-header">
      <div className="capture-header__text">
        <span className="capture-header__dot" />
        <div className="capture-header__text-labels">
          <span className="capture-header__label-main">촬영</span>
          <span className="capture-header__label-sub">CAPTURING</span>
        </div>
      </div>

      <span className="capture-header__divider" />

      <div className="capture-header__units">
        <span className="capture-header__field-label">촬영 중</span>
        <div className="capture-header__units-value-row">
          <span className="capture-header__units-count">{capturingCount}</span>
          <span className="capture-header__units-unit">active</span>
        </div>
      </div>

      <span className="capture-header__divider" />

      <div className="capture-header__total">
        <span className="capture-header__field-label">촬영 완료</span>
        <span className="capture-header__field-value">{cumulativeCapturedCount}</span>
      </div>

      <span className="capture-header__divider" />

      <div className="capture-header__current-batch">
        <span className="capture-header__field-label">촬영 속도</span>
        <span className="capture-header__field-value">
          {captureSpeed !== null ? `${captureSpeed.toFixed(1)}s` : '-'}
        </span>
      </div>

      <span className="capture-header__divider" />

      <div className="capture-header__next-batch">
        <span className="capture-header__field-label">현재 배치</span>
        <span className="capture-header__field-value">
          {capturingBatchId !== undefined ? `#${capturingBatchId}` : '-'}
        </span>
      </div>

      <div className="capture-header__spacer" />

      <div className={`capture-header__status${isLive ? '' : ' capture-header__status--off'}`}>
        <span className="capture-header__status-dot" />
        <span className="capture-header__status-text">
          {isLive ? 'LIVE · 연결됨' : 'OFF · 종료됨'}
        </span>
      </div>

      <SimControl />
    </div>
  )
}

export { CaptureHeader }
