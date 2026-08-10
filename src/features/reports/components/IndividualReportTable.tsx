import { useNavigate } from 'react-router-dom'
import './ReportTable.css'
import { ROUTES } from '@/core/navigation/routes'
import { Pagination } from '@/shared/ui/Pagination'
import { useIndividualReportListStore } from '../store/useIndividualReportListStore'
import { useReportListFilters } from '../hooks/useReportListFilters'
import { ReportStatusBadge } from './ReportStatusBadge'
import { ReportListToolbar } from './ReportListToolbar'
import { ListSkeletonRows, ListEmptyRow, ListErrorRow } from '@/shared/ui/ListStates'

const COLUMN_COUNT = 4

function formatDateTime(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IndividualReportTable() {
  const navigate = useNavigate()
  const list = useIndividualReportListStore((s) => s.list)
  const isLoading = useIndividualReportListStore((s) => s.isLoading)
  const error = useIndividualReportListStore((s) => s.error)
  const { fetchList } = useIndividualReportListStore((s) => s.actions)

  const {
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    counts,
    filtered,
    pagedList,
    totalPages,
    rangeStart,
    rangeEnd,
    resetFilters,
    retry,
  } = useReportListFilters(list, fetchList)

  return (
    <section className="report-table">
      <div className="report-table__header">
        <h1 className="report-table__title">개별 리포트</h1>
      </div>

      <ReportListToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        counts={counts}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        search={search}
        onSearchChange={setSearch}
      />

      <div className="report-table__card">
        <table className="report-table__table">
          <colgroup>
            <col style={{ width: '16rem' }} />
            <col />
            <col style={{ width: '22rem' }} />
            <col style={{ width: '26rem' }} />
          </colgroup>
          <thead>
            <tr>
              <th>상태</th>
              <th>제목</th>
              <th>수정일시</th>
              <th>생성일시</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <ListSkeletonRows colSpan={COLUMN_COUNT} />}

            {!isLoading && error && <ListErrorRow colSpan={COLUMN_COUNT} message={error} onRetry={retry} />}

            {!isLoading && !error && list.length === 0 && (
              <ListEmptyRow
                colSpan={COLUMN_COUNT}
                variant="no-data"
                title="생성된 리포트가 없습니다"
                subtitle="배터리 상세 화면에서 개별 리포트를 생성할 수 있습니다"
              />
            )}

            {!isLoading && !error && list.length > 0 && filtered.length === 0 && (
              <ListEmptyRow
                colSpan={COLUMN_COUNT}
                variant="no-results"
                title="조건에 맞는 항목이 없습니다"
                subtitle="필터 또는 검색어를 조정해 보세요"
                actionLabel="필터 초기화"
                onAction={resetFilters}
              />
            )}

            {!isLoading &&
              !error &&
              pagedList.map((item) => (
                <tr key={item.reportId} onClick={() => navigate(ROUTES.REPORT_INDIVIDUAL_DETAIL(item.reportId))}>
                  <td>
                    <ReportStatusBadge status={item.status} />
                  </td>
                  <td>{item.title ?? `리포트 #${item.reportId}`}</td>
                  <td className="report-table__secondary report-table__mono">{formatDateTime(item.updatedAt)}</td>
                  <td className="report-table__secondary report-table__mono">
                    {formatDateTime(item.createdAt)}
                    <span className="report-table__chevron">
                      <ChevronIcon />
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="report-table__footer">
          <span className="report-table__count">
            {filtered.length === 0 ? '0건' : `${filtered.length}건 중 ${rangeStart}–${rangeEnd}`}
          </span>
          {filtered.length > 0 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </div>
      </div>
    </section>
  )
}

export default IndividualReportTable
