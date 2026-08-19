import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '@/shared/ui/ListPageShell.css'
import { ROUTES } from '@/core/navigation/routes'
import { Pagination } from '@/shared/ui/Pagination'
import { ListRowChevron } from '@/shared/ui/ListRowChevron'
import { PageSizeSelector } from '@/shared/ui/PageSizeSelector'
import { useDailyReportListStore } from '../store/useDailyReportListStore'
import { useDailyReportDetailStore } from '../store/useDailyReportDetailStore'
import { useReportListFilters } from '../hooks/useReportListFilters'
import { ReportStatusBadge } from './ReportStatusBadge'
import { ReportListToolbar } from './ReportListToolbar'
import { ListSkeletonRows, ListEmptyRow, ListErrorRow } from '@/shared/ui/ListStates'
import { DailyReportCreatePopover } from './DailyReportCreatePopover'

const COLUMN_COUNT = 4

function formatDateTime(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function DailyReportTable() {
  const navigate = useNavigate()
  const list = useDailyReportListStore((s) => s.list)
  const pageable = useDailyReportListStore((s) => s.pageable)
  const isLoading = useDailyReportListStore((s) => s.isLoading)
  const error = useDailyReportListStore((s) => s.error)
  const { fetchList } = useDailyReportListStore((s) => s.actions)
  const { create } = useDailyReportDetailStore((s) => s.actions)

  const {
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pagedList,
    totalPages,
    totalElements,
    rangeStart,
    rangeEnd,
    resetFilters,
    retry,
  } = useReportListFilters(list, fetchList, pageable)

  const [creatorOpen, setCreatorOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const handleCreate = async (reportDate: string) => {
    setCreating(true)
    try {
      const reportId = await create({ reportDate })
      setCreatorOpen(false)
      navigate(ROUTES.REPORT_DAILY_DETAIL(reportId))
    } catch {
      setCreating(false)
    }
  }

  return (
    <section className="list-page">
      <div className="list-page__header">
        <h1 className="list-page__title">일일 리포트</h1>
        <div style={{ position: 'relative' }}>
          <button type="button" className="list-page__action-btn" onClick={() => setCreatorOpen((v) => !v)}>
            + 리포트 생성
          </button>
          {creatorOpen && (
            <DailyReportCreatePopover
              onClose={() => setCreatorOpen(false)}
              onSubmit={handleCreate}
              submitting={creating}
            />
          )}
        </div>
      </div>

      <ReportListToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        search={search}
        onSearchChange={setSearch}
      />

      <div className="list-page__card">
        <div className="list-page__scroll">
          <table className="list-page__table">
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
                <th>판정일자</th>
                <th>생성일시</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <ListSkeletonRows colSpan={COLUMN_COUNT} />}

              {!isLoading && error && <ListErrorRow colSpan={COLUMN_COUNT} message={error} onRetry={retry} />}

              {!isLoading && !error && list.length === 0 && !search && !statusFilter && (
                <ListEmptyRow
                  colSpan={COLUMN_COUNT}
                  variant="no-data"
                  title="생성된 리포트가 없습니다"
                  subtitle="기준일을 선택해 리포트를 생성해 보세요"
                  actionLabel="+ 리포트 생성"
                  onAction={() => setCreatorOpen(true)}
                />
              )}

              {!isLoading && !error && list.length === 0 && (search || statusFilter) && (
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
                  <tr key={item.reportId} onClick={() => navigate(ROUTES.REPORT_DAILY_DETAIL(item.reportId))}>
                    <td>
                      <ReportStatusBadge status={item.status} />
                    </td>
                    <td>{item.title ?? `리포트 #${item.reportId}`}</td>
                    <td className="list-page__secondary list-page__mono">{item.reportDate}</td>
                    <td className="list-page__secondary list-page__mono">
                      {formatDateTime(item.createdAt)}
                      <ListRowChevron />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="list-page__footer">
          <span className="list-page__count">
            {list.length === 0 ? '0건' : `${totalElements}건 중 ${rangeStart}–${rangeEnd}`}
          </span>
          <div className="list-page__footer-right">
            <PageSizeSelector value={pageSize} onChange={setPageSize} />
            {list.length > 0 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default DailyReportTable
