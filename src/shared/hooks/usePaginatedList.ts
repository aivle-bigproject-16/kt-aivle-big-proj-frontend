import { useState } from 'react'

/**
 * 목록 페이지네이션 공용 훅.
 * resetKey가 바뀌면(필터·검색어 변경) 1페이지로 되돌린다. 렌더 도중 이전 값과
 * 비교해 바로 조정 — useEffect를 쓰면 한 번 더 렌더가 도는 것을 피한다.
 */
function usePaginatedList<T>(items: T[], resetKey: string) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const combinedResetKey = `${resetKey}|${pageSize}`
  const [prevResetKey, setPrevResetKey] = useState(combinedResetKey)

  if (combinedResetKey !== prevResetKey) {
    setPrevResetKey(combinedResetKey)
    setCurrentPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const pagedList = items.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const rangeStart = items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, items.length)

  return { currentPage, setCurrentPage, pageSize, setPageSize, pagedList, totalPages, rangeStart, rangeEnd }
}

export { usePaginatedList }
