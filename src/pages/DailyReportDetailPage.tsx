import { useParams } from 'react-router-dom'
import { DailyReport } from '@/features/reports'

function DailyReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <DailyReport reportId={Number(reportId)} />
    </div>
  )
}

export default DailyReportDetailPage
