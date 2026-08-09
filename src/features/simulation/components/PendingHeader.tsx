import { useSimulationStore } from '../store/useSimulationStore'
import { SimControl } from './SimControl'
import './PendingHeader.css'

/** 펜딩 헤더 — 1400×100 고정, 곡률 1rem. 내부 6개 영역이 가로로 정렬된다:
   text / units / total / current batch / next batch / status */
function PendingHeader() {
  const pendingCount = useSimulationStore((s) => s.registered.length)
  const totalCount = useSimulationStore((s) => s.batteryCellCount)
  /* 대기 배치 — 대기열 맨 앞(FIFO) 배치 id. PendingBody가 "다음 촬영 대상"으로
     펼쳐 보여주는 배치와 같아야 한다 */
  const currentBatchId = useSimulationStore((s) => s.registered[0]?.batchId)
  /* 다음 배치 — 대기열에서 currentBatchId 다음으로 오는 배치 id (두 번째로 대기 중인 배치) */
  const nextBatchId = useSimulationStore((s) => {
    const first = s.registered[0]?.batchId
    return s.registered.find((c) => c.batchId !== first)?.batchId
  })
  const isLive = useSimulationStore((s) => s.simulationStatus === 'running')

  return (
    <div className="pending-header">
      <div className="pending-header__text">
        <span className="pending-header__dot" />
        <div className="pending-header__text-labels">
          <span className="pending-header__label-main">대기</span>
          <span className="pending-header__label-sub">PENDING</span>
        </div>
      </div>

      <span className="pending-header__divider" />

      <div className="pending-header__units">
        <span className="pending-header__field-label">대기 셀</span>
        <div className="pending-header__units-value-row">
          <span className="pending-header__units-count">{pendingCount}</span>
          <span className="pending-header__units-unit">units</span>
        </div>
      </div>

      <span className="pending-header__divider" />

      <div className="pending-header__total">
        <span className="pending-header__field-label">총 셀</span>
        <span className="pending-header__field-value">{totalCount}</span>
      </div>

      <span className="pending-header__divider" />

      <div className="pending-header__current-batch">
        <span className="pending-header__field-label">대기 배치</span>
        <span className="pending-header__field-value">
          {currentBatchId !== undefined ? `#${currentBatchId}` : '-'}
        </span>
      </div>

      <span className="pending-header__divider" />

      <div className="pending-header__next-batch">
        <span className="pending-header__field-label">다음 배치</span>
        <span className="pending-header__field-value">
          {nextBatchId !== undefined ? `#${nextBatchId}` : '-'}
        </span>
      </div>

      <div className="pending-header__spacer" />

      <div className={`pending-header__status${isLive ? '' : ' pending-header__status--off'}`}>
        <span className="pending-header__status-dot" />
        <span className="pending-header__status-text">
          {isLive ? 'LIVE · 연결됨' : 'OFF · 종료됨'}
        </span>
      </div>

      <SimControl />
    </div>
  )
}

export { PendingHeader }
