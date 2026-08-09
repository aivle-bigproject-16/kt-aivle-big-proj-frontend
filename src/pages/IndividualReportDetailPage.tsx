import { useParams } from 'react-router-dom'
import { IndividualReport } from '@/features/reports'

function IndividualReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <IndividualReport reportId={Number(reportId)} />
    </div>
  )
}

export default IndividualReportDetailPage
