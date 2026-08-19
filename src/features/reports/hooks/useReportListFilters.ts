import { useState, useCallback } from 'react'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { useServerPagination } from '@/shared/hooks/useServerPagination'
import type { ReportStatus } from '../types'
import type { Pageable } from '@/shared/types/api'

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
 * 백엔드 서버 사이드 페이징을 지원한다.
 */
function useReportListFilters<T extends ReportListItemLike>(
  list: T[],
  fetchList: (params: { page?: number; size?: number; sort?: string; keyword?: string; status?: string }) => void,
  pageable: Pageable | null
) {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | null>(null)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const handleFetch = useCallback((page: number, size: number) => {
    fetchList({
      page,
      size,
      sort: toSortParam(sortOrder),
      keyword: debouncedSearch.trim() || undefined,
      status: statusFilter || undefined
    })
  }, [fetchList, sortOrder, debouncedSearch, statusFilter])

  const { currentPage, setCurrentPage, pageSize, setPageSize, totalPages, totalElements, rangeStart, rangeEnd } = useServerPagination(
    handleFetch,
    `${statusFilter ?? ''}|${debouncedSearch}|${sortOrder}`,
    pageable
  )

  const resetFilters = () => {
    setStatusFilter(null)
    setSearch('')
  }

  const retry = () => handleFetch(currentPage - 1, pageSize)


  return {
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
    filtered: list, // 호환성을 위해 이름 유지
    pagedList: list, // 이제 프론트엔드가 자르는게 아니라 백엔드가 자른 데이터를 그대로 사용
    totalPages,
    totalElements,
    rangeStart,
    rangeEnd,
    resetFilters,
    retry,
  }
}

export { useReportListFilters }
