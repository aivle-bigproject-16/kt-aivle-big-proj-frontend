import { useNavigate } from 'react-router-dom'
import { Modal } from '@/shared/ui/Modal'
import type { FinalLabel } from '@/features/battery/types'
import type { CellProgress } from '../types'
import { ROUTES } from '@/core/navigation/routes'
// 1200 기준 구 CSS는 history/SimulationCardModal.css로 이동됨 — 1400 기준으로 새로 만들 것

interface SimulationCardModalProps {
  open: boolean
  onClose: () => void
  label: string
  cells: CellProgress[]
  statusSource?: 'status' | 'finalLabel'
  finalLabelFilter?: FinalLabel
  emptyMessage?: string
}

function normalizeStatusClass(status: string) {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function SimulationCardModal({
  open,
  onClose,
  label,
  cells,
  statusSource = 'status',
  finalLabelFilter,
  emptyMessage = '현재 처리 중인 셀이 없습니다.',
}: SimulationCardModalProps) {
  const navigate = useNavigate()

  const rows = cells
    .filter((cell) => (finalLabelFilter ? cell.finalLabel === finalLabelFilter : true))
    .map((cell) => ({
      batchId: cell.batchId,
      batteryCellId: cell.batteryCellId,
      status: statusSource === 'finalLabel' ? (cell.finalLabel ?? '-') : cell.status,
    }))

  return (
    <Modal open={open} onClose={onClose} className="simulation-card-modal">
      <div className="simulation-card-modal__header">
        <h3 className="simulation-card-modal__title">{label}</h3>
        <button className="simulation-card-modal__close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="simulation-card-modal__empty">{emptyMessage}</p>
      ) : (
        <div className="simulation-card-modal__table-wrap">
          <table className="simulation-card-modal__table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Cell ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.batchId}-${row.batteryCellId}`}
                  className="simulation-card-modal__row--clickable"
                  onClick={() => navigate(ROUTES.BATTERY_DETAIL(row.batteryCellId))}
                >
                  <td>{row.batchId}</td>
                  <td>{row.batteryCellId}</td>
                  <td>
                    <span
                      className={`simulation-card-modal__status simulation-card-modal__status--${normalizeStatusClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}

export { SimulationCardModal }
