import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/core/navigation/routes'
import { useIndividualReportListStore } from '../store/useIndividualReportListStore'

function IndividualReportMockList() {
  const list = useIndividualReportListStore((s) => s.list)
  const isLoading = useIndividualReportListStore((s) => s.isLoading)
  const error = useIndividualReportListStore((s) => s.error)
  const { fetchList } = useIndividualReportListStore((s) => s.actions)

  useEffect(() => {
    fetchList(0, 100)
  }, [fetchList])

  return (
    <section>
      <h2>개별 리포트 목록</h2>
      {isLoading && <p>로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {list.map((item) => (
          <li key={item.reportId}>
            <Link to={ROUTES.REPORT_INDIVIDUAL_DETAIL(item.reportId)}>
              [{item.status}] {item.title ?? `리포트 #${item.reportId}`}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default IndividualReportMockList
