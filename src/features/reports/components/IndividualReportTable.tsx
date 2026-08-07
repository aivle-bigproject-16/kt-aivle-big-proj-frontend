import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ReportTable.css'
import { ROUTES } from '@/core/navigation/routes'
import { Pagination } from '@/shared/ui/Pagination'
import { useIndividualReportListStore } from '../store/useIndividualReportListStore'
import { ReportStatusBadge } from './ReportStatusBadge'
import { ReportListToolbar } from './ReportListToolbar'
import { ReportListSkeletonRows, ReportListEmptyRow, ReportListErrorRow } from './ReportListStates'
import type { ReportStatus } from '../types'

const PAGE_SIZE = 20
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

  const [statusFilter, setStatusFilter] = useState<ReportStatus | null>(null)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchList(0, 100, sortOrder === 'desc' ? 'createdAt,desc' : 'createdAt,asc')
  }, [fetchList, sortOrder])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // 필터·검색어가 바뀌면 1페이지로 리셋한다. 렌더 도중 이전 값과 비교해 바로 조정 —
  // useEffect를 쓰면 한 번 더 렌더가 도는 것을 피한다 (React 공식 권장 패턴).
  const filterKey = `${statusFilter ?? ''}|${debouncedSearch}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setCurrentPage(1)
  }

  const counts = useMemo(
    () => ({
      total: list.length,
      completed: list.filter((r) => r.status === 'COMPLETED').length,
      pending: list.filter((r) => r.status === 'PENDING').length,
      failed: list.filter((r) => r.status === 'FAILED').length,
    }),
    [list],
  )

  const filtered = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase()
    return list.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false
      if (keyword) {
        const title = (item.title ?? `리포트 #${item.reportId}`).toLowerCase()
        if (!title.includes(keyword)) return false
      }
      return true
    })
  }, [list, statusFilter, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pagedList = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const handleResetFilters = () => {
    setStatusFilter(null)
    setSearch('')
  }

  const handleRetry = () => {
    fetchList(0, 100, sortOrder === 'desc' ? 'createdAt,desc' : 'createdAt,asc')
  }

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
            <col style={{ width: '24rem' }} />
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
            {isLoading && <ReportListSkeletonRows colSpan={COLUMN_COUNT} />}

            {!isLoading && error && (
              <ReportListErrorRow colSpan={COLUMN_COUNT} message={error} onRetry={handleRetry} />
            )}

            {!isLoading && !error && list.length === 0 && (
              <ReportListEmptyRow
                colSpan={COLUMN_COUNT}
                variant="no-data"
                title="생성된 리포트가 없습니다"
                subtitle="배터리 상세 화면에서 개별 리포트를 생성할 수 있습니다"
              />
            )}

            {!isLoading && !error && list.length > 0 && filtered.length === 0 && (
              <ReportListEmptyRow
                colSpan={COLUMN_COUNT}
                variant="no-results"
                title="조건에 맞는 항목이 없습니다"
                subtitle="필터 또는 검색어를 조정해 보세요"
                actionLabel="필터 초기화"
                onAction={handleResetFilters}
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
