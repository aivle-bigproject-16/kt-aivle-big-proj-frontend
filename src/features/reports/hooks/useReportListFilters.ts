import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { usePaginatedList } from '@/shared/hooks/usePaginatedList'
import type { ReportStatus } from '../types'

interface ReportListItemLike {
  reportId: number
  status: ReportStatus
  title: string | null
}

function toSortParam(order: 'desc' | 'asc'): string {
  return order === 'desc' ? 'createdAt,desc' : 'createdAt,asc'
}

/**
 * 일일/개별 리포트 목록 화면의 상태 필터·검색·정렬·페이징을 공용으로 처리한다.
 * 정렬은 fetchList(page, size, sort) 재호출로, 상태 필터·검색은 로드된 배열 안에서 처리한다
 * (LIST_REDESIGN.md §8 — sort만 실제 API 파라미터가 있고 필터·검색은 서버 파라미터가 없다).
 */
function useReportListFilters<T extends ReportListItemLike>(
  list: T[],
  fetchList: (page: number, size: number, sort: string) => void,
) {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | null>(null)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  useEffect(() => {
    fetchList(0, 100, toSortParam(sortOrder))
  }, [fetchList, sortOrder])

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

  const { currentPage, setCurrentPage, pagedList, totalPages, rangeStart, rangeEnd } = usePaginatedList(
    filtered,
    `${statusFilter ?? ''}|${debouncedSearch}`,
  )

  const resetFilters = () => {
    setStatusFilter(null)
    setSearch('')
  }

  const retry = () => fetchList(0, 100, toSortParam(sortOrder))

  return {
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
  }
}

export { useReportListFilters }
