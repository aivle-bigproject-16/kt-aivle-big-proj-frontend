import { useParams } from 'react-router-dom'
import { NoticeEdit } from '@/features/notice'

function NoticeEditPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <NoticeEdit id={Number(id)} />
    </div>
  )
}

export default NoticeEditPage
