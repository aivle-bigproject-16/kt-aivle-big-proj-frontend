import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/core/navigation/routes'
import { useDailyReportListStore } from '../store/useDailyReportListStore'

function DailyReportMockList() {
  const list = useDailyReportListStore((s) => s.list)
  const isLoading = useDailyReportListStore((s) => s.isLoading)
  const error = useDailyReportListStore((s) => s.error)
  const { fetchList } = useDailyReportListStore((s) => s.actions)

  useEffect(() => {
    fetchList({ page: 0, size: 100 })
  }, [fetchList])

  return (
    <section>
      <h2>일일 리포트 목록</h2>
      {isLoading && <p>로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {list.map((item) => (
          <li key={item.reportId}>
            <Link to={ROUTES.REPORT_DAILY_DETAIL(item.reportId)}>
              [{item.status}] {item.title ?? `리포트 #${item.reportId}`}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default DailyReportMockList
