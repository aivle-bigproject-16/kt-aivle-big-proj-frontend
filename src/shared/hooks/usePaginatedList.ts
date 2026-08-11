import { useState } from 'react'

const PAGE_SIZE = 20

/**
 * 목록 페이지네이션 공용 훅 (페이지 크기 20 고정 — LIST_REDESIGN.md §8.5).
 * resetKey가 바뀌면(필터·검색어 변경) 1페이지로 되돌린다. 렌더 도중 이전 값과
 * 비교해 바로 조정 — useEffect를 쓰면 한 번 더 렌더가 도는 것을 피한다.
 */
function usePaginatedList<T>(items: T[], resetKey: string) {
  const [currentPage, setCurrentPage] = useState(1)

  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    setCurrentPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const pagedList = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeStart = items.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, items.length)

  return { currentPage, setCurrentPage, pagedList, totalPages, rangeStart, rangeEnd }
}

export { usePaginatedList }
