import { useState, type FormEvent } from 'react'
// 1200 기준 구 CSS는 history/SimControlPanel.css로 이동됨 — 1400 기준으로 새로 만들 것
import { useSimulationStore } from '../store/useSimulationStore'

interface SimControlPanelProps {
  onClose: () => void
}

function SimControlPanel({ onClose }: SimControlPanelProps) {
  const isStarting = useSimulationStore((s) => s.isStarting)
  const startError = useSimulationStore((s) => s.startError)
  const { start } = useSimulationStore((s) => s.actions)

  const [batchSize, setBatchSize] = useState(6)
  const [batteryCellCount, setBatteryCellCount] = useState(120)
  const [captureSpeed, setCaptureSpeed] = useState(5)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await start({ batchSize, batteryCellCount, captureSpeed })
    if (!useSimulationStore.getState().startError) onClose()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="sim-settings-card">
        <div className="sim-settings-row sim-settings-row--batch">
          <span className="sim-settings-label sim-settings-label--batch">배치 사이즈 :</span>
          <div className="sim-settings-box">
            <input
              type="number"
              className="sim-settings-input"
              min={1}
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="sim-settings-row sim-settings-row--photo">
          <span className="sim-settings-label sim-settings-label--photo">사진 수 :</span>
          <div className="sim-settings-box">
            <input
              type="number"
              className="sim-settings-input"
              min={1}
              value={batteryCellCount}
              onChange={(e) => setBatteryCellCount(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="sim-settings-row sim-settings-row--speed">
          <span className="sim-settings-label sim-settings-label--speed">촬영 속도 :</span>
          <div className="sim-settings-box">
            <input
              type="number"
              className="sim-settings-input"
              min={1}
              value={captureSpeed}
              onChange={(e) => setCaptureSpeed(Number(e.target.value))}
              required
            />
          </div>
        </div>
      </div>

      {startError && <p className="sim-settings-error">{startError}</p>}

      <div className="sim-settings-actions">
        <button type="button" onClick={onClose} disabled={isStarting}>
          취소
        </button>
        <button type="submit" disabled={isStarting}>
          {isStarting ? '시작 중...' : '시작'}
        </button>
      </div>
    </form>
  )
}

export default SimControlPanel
