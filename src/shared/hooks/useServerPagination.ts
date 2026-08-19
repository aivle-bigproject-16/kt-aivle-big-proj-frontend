import { useState, useEffect } from 'react'
import type { Pageable } from '@/shared/types/api'

export function useServerPagination(
  fetchCallback: (page: number, size: number) => void,
  resetKey: string,
  pageable: Pageable | null,
) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // resetKey가 바뀌면 무조건 1페이지로 이동
  useEffect(() => {
    setCurrentPage(1)
    fetchCallback(0, pageSize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  // 페이지 또는 사이즈 변경 시 호출
  useEffect(() => {
    fetchCallback(currentPage - 1, pageSize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize])

  const totalPages = pageable?.totalPages || 1
  const totalElements = pageable?.totalElements || 0
  const rangeStart = totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalElements)

  return { currentPage, setCurrentPage, pageSize, setPageSize, totalPages, totalElements, rangeStart, rangeEnd }
}
