import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSimulationStore } from '../store/useSimulationStore'
import { ROUTES } from '@/core/navigation/routes'
import type { CellProgress } from '../types'
import './AnalyzeBody.css'

/** 분석 본문 — 가로 정렬된 두 영역. 좌측 660×700(분석 상태), 우측 710×700(배치 상태), 사이 갭 30 */
function AnalyzeBody() {
  return (
    <div className="analyze-body">
      <AnalyzeLeft />
      <AnalyzeRight />
    </div>
  )
}

function AnalyzeLeft() {
  const analyze = useSimulationStore((s) => s.analyze)
  const analyzingCount = analyze ? 1 : 0

  return (
    <div className="analyze-body__left">
      <div className="analyze-body__left-header">
        <span className="analyze-body__left-title">분석 상태</span>
        <span className="analyze-body__left-subtitle">IN PROGRESS</span>
      </div>

      <div className="analyze-body__panel">
        <div className="analyze-body__panel-accent" />
        <div className="analyze-body__panel-content">
          <span className="analyze-body__panel-cell">
            {analyze ? `CELL-${analyze.batteryCellId}` : '-'}
          </span>
          <span className="analyze-body__panel-meta">
            {analyze ? `Batch #${analyze.batchId} · CAPTURED 후 분석 큐 진입` : '분석 중인 셀 없음'}
          </span>
          <div className="analyze-body__panel-progress">
            <span
              className={`analyze-body__panel-spinner${analyzingCount === 0 ? ' analyze-body__panel-spinner--paused' : ''}`}
            />
            <span className="analyze-body__panel-progress-text">
              {analyzingCount === 0 ? '분석 대기 중' : 'AI 추론 진행 중'}
            </span>
          </div>

          <div className="analyze-body__panel-chips">
            <div className="analyze-body__panel-chip">
              <span className="analyze-body__panel-chip-label">CT</span>
              <span className="analyze-body__panel-chip-dot analyze-body__panel-chip-dot--ct" />
              <span className="analyze-body__panel-chip-text analyze-body__panel-chip-text--ct">
                {analyzingCount === 0 ? '대기 중' : '분석 중'}
              </span>
            </div>
            <div className="analyze-body__panel-chip">
              <span className="analyze-body__panel-chip-label">RGB</span>
              <span className="analyze-body__panel-chip-dot analyze-body__panel-chip-dot--rgb" />
              <span className="analyze-body__panel-chip-text analyze-body__panel-chip-text--rgb">
                {analyzingCount === 0 ? '대기 중' : '분석 중'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyzeRight() {
  const analyzeBatchId = useSimulationStore((s) => s.analyze?.batchId)
  const registered = useSimulationStore((s) => s.registered)
  const capture = useSimulationStore((s) => s.capture)
  const analyze = useSimulationStore((s) => s.analyze)
  const completed = useSimulationStore((s) => s.completed)

  /* 분석 중인 셀과 같은 배치의 셀들을 모든 단계(대기/촬영/분석/완료)에서 모아
     번호순으로 나열한다 — 배치 상태 패널은 배치 전체의 진행 상황을 보여준다 */
  const batchCells = useMemo(() => {
    if (analyzeBatchId === undefined) return []
    const all = [...registered, ...capture, ...(analyze ? [analyze] : []), ...completed]
    return all
      .filter((c) => c.batchId === analyzeBatchId)
      .sort((a, b) => a.batteryCellId - b.batteryCellId)
  }, [analyzeBatchId, registered, capture, analyze, completed])

  return (
    <div className="analyze-body__right">
      <div className="analyze-body__right-header">
        <div className="analyze-body__right-title-group">
          <span className="analyze-body__right-title">배치 상태</span>
          <span className="analyze-body__right-subtitle">BATCH</span>
        </div>
        <span className="analyze-body__right-count">{batchCells.length} cells</span>
      </div>
      <span className="analyze-body__right-hint">현재 배치 상태 모니터링</span>

      <div className="analyze-body__right-list">
        {batchCells.map((cell, i) => (
          <AnalyzeBatchCellRow key={cell.batteryCellId} index={i + 1} cell={cell} />
        ))}
      </div>
    </div>
  )
}

function AnalyzeBatchCellRow({ index, cell }: { index: number; cell: CellProgress }) {
  const navigate = useNavigate()
  const tone =
    cell.finalLabel === 'PASS'
      ? 'pass'
      : cell.finalLabel === 'REJECT'
        ? 'reject'
        : cell.finalLabel === 'FAIL'
          ? 'fail'
          : 'neutral'

  return (
    <button
      type="button"
      className={`analyze-body__row analyze-body__row--${tone}`}
      onClick={() => navigate(ROUTES.BATTERY_DETAIL(cell.batteryCellId))}
    >
      <span className="analyze-body__row-index">{index}</span>
      <AnalyzeBatteryIcon />
      <span className="analyze-body__row-id">CELL-{cell.batteryCellId}</span>
      <span className="analyze-body__row-status">{cell.finalLabel ?? cell.status}</span>
    </button>
  )
}

function AnalyzeBatteryIcon() {
  return (
    <svg width="17" height="31" viewBox="0 0 17 31" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.0371 0L5.7514 0C5.35691 0 5.03711 0.319799 5.03711 0.714292L5.03711 1.42858C5.03711 1.82308 5.35691 2.14288 5.7514 2.14288L10.0371 2.14288C10.4316 2.14288 10.7514 1.82308 10.7514 1.42858V0.714292C10.7514 0.319799 10.4316 0 10.0371 0Z"
        fill="#94A3B8"
      />
      <path
        d="M14.25 2L2.25 2C1.42157 2 0.75 2.64287 0.75 3.4359L0.75 28.5641C0.75 29.3571 1.42157 30 2.25 30H14.25C15.0784 30 15.75 29.3571 15.75 28.5641L15.75 3.4359C15.75 2.64287 15.0784 2 14.25 2Z"
        stroke="#2ECC71"
        strokeWidth="1.5"
      />
      <rect x="2.75" y="4" width="11" height="24" fill="#2ECC71" />
    </svg>
  )
}

export { AnalyzeBody }
