import { useState } from 'react'
import { useSimulationStore } from '../store/useSimulationStore'
import './SimControl.css'

/** Sim Control 버튼 — 클릭하면 시뮬레이션 시작 폼 팝오버가 뜬다.
   Overview/PendingHeader 등 여러 헤더에서 공용으로 쓴다 */
function SimControl() {
  const [open, setOpen] = useState(false)

  return (
    <div className="sim-control-wrap">
      <button type="button" className="sim-control" onClick={() => setOpen((v) => !v)}>
        <svg style={{ width: '1.5rem', height: '1.5rem' }} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7.5" cy="7.5" r="4.9" stroke="#5B5F63" strokeWidth="1" />
          <line x1="7.5" y1="0" x2="7.5" y2="2.5" stroke="#5B5F63" strokeWidth="1" strokeLinecap="round" />
          <line x1="7.5" y1="12.5" x2="7.5" y2="15" stroke="#5B5F63" strokeWidth="1" strokeLinecap="round" />
          <line x1="0" y1="7.5" x2="2.5" y2="7.5" stroke="#5B5F63" strokeWidth="1" strokeLinecap="round" />
          <line x1="12.5" y1="7.5" x2="15" y2="7.5" stroke="#5B5F63" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <span className="sim-control__text">Sim Control</span>
      </button>

      {open && <SimControlPopover onClose={() => setOpen(false)} />}
    </div>
  )
}

/* 대충 만든 시뮬레이션 시작 폼 — 배치 크기/총 셀 수/촬영 속도 입력받아 POST /sim 호출 */
function SimControlPopover({ onClose }: { onClose: () => void }) {
  const isStarting = useSimulationStore((s) => s.isStarting)
  const startError = useSimulationStore((s) => s.startError)
  const start = useSimulationStore((s) => s.actions.start)

  const [batchSize, setBatchSize] = useState(5)
  const [batteryCellCount, setBatteryCellCount] = useState(20)
  const [captureSpeed, setCaptureSpeed] = useState(5)

  const handleStart = async () => {
    await start({ batchSize, batteryCellCount, captureSpeed })
    onClose()
  }

  return (
    <div className="sim-control__popover">
      <label className="sim-control__field">
        배치 크기
        <input
          type="number"
          min={1}
          value={batchSize}
          onChange={(e) => setBatchSize(Number(e.target.value))}
        />
      </label>
      <label className="sim-control__field">
        총 셀 수
        <input
          type="number"
          min={1}
          value={batteryCellCount}
          onChange={(e) => setBatteryCellCount(Number(e.target.value))}
        />
      </label>
      <label className="sim-control__field">
        촬영 속도(초)
        <input
          type="number"
          min={0.1}
          step={0.1}
          value={captureSpeed}
          onChange={(e) => setCaptureSpeed(Number(e.target.value))}
        />
      </label>

      {startError && <p className="sim-control__error">{startError}</p>}

      <button type="button" className="sim-control__start" disabled={isStarting} onClick={handleStart}>
        {isStarting ? '시작 중...' : '시뮬레이션 시작'}
      </button>
    </div>
  )
}

export { SimControl }
