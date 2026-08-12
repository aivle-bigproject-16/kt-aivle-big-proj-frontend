import { useParams } from 'react-router-dom'
import { BatteryDetailCard, BatteryDetailListNav } from '@/features/battery'

function BatteryDetailPage() {
  const { batteryCellId } = useParams<{ batteryCellId: string }>()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <BatteryDetailListNav />
      <BatteryDetailCard batteryCellId={Number(batteryCellId)} />
    </div>
  )
}

export default BatteryDetailPage
