import './ReportStatusBadge.css'
import type { ReportStatus } from '../types'

interface ReportStatusBadgeProps {
  status: ReportStatus
}

function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  if (status === 'COMPLETED') {
    return <span className="report-status-badge report-status-badge--completed">COMPLETED</span>
  }

  if (status === 'PENDING') {
    return (
      <span className="report-status-badge report-status-badge--pending">
        <span className="report-status-badge__dot" />
        PENDING
      </span>
    )
  }

  return (
    <span className="report-status-badge report-status-badge--failed">
      <span className="report-status-badge__triangle" />
      FAILED
    </span>
  )
}

export { ReportStatusBadge }
