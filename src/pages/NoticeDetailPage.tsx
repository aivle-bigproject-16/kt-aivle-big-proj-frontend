import { useParams } from 'react-router-dom'
import { NoticeDetail } from '@/features/notice'

function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <NoticeDetail id={Number(id)} />
    </div>
  )
}

export default NoticeDetailPage
