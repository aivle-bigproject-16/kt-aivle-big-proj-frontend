import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '@/shared/ui/ListPageShell.css'
import { ROUTES } from '@/core/navigation/routes'
import { Pagination } from '@/shared/ui/Pagination'
import { SearchBox } from '@/shared/ui/SearchBox'
import { ListRowChevron } from '@/shared/ui/ListRowChevron'
import { ListSkeletonRows, ListEmptyRow, ListErrorRow } from '@/shared/ui/ListStates'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { usePaginatedList } from '@/shared/hooks/usePaginatedList'
import { useNoticeListStore } from '../store/useNoticeListStore'
import { useLoginStore } from '@/features/auth'
import { hasRole } from '@/shared/security/access'
import { maskName } from '@/shared/security/masking'

const COLUMN_COUNT = 3

function formatDate(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function NoticeTable() {
  const navigate = useNavigate()
  const list = useNoticeListStore((s) => s.list)
  const isLoading = useNoticeListStore((s) => s.isLoading)
  const error = useNoticeListStore((s) => s.error)
  const { fetchList } = useNoticeListStore((s) => s.actions)
  const role = useLoginStore((s) => s.role)
  const isAdmin = hasRole(role, 'ADMIN')

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  useEffect(() => {
    fetchList(0, 100)
  }, [fetchList])

  const filtered = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase()
    if (!keyword) return list
    return list.filter((item) => item.title.toLowerCase().includes(keyword))
  }, [list, debouncedSearch])

  const { currentPage, setCurrentPage, pagedList, totalPages, rangeStart, rangeEnd } =
    usePaginatedList(filtered, debouncedSearch)

  return (
    <section className="list-page">
      <div className="list-page__header">
        <h1 className="list-page__title">공지사항</h1>
        {isAdmin && (
          <Link to={ROUTES.NOTICE_CREATE} className="list-page__action-btn">
            + 공지 작성
          </Link>
        )}
      </div>

      <div className="list-page__toolbar">
        <span />
        <SearchBox value={search} onChange={setSearch} placeholder="제목 검색" />
      </div>

      <div className="list-page__card">
        <div className="list-page__scroll">
          <table className="list-page__table">
            <colgroup>
              <col />
              <col style={{ width: '18rem' }} />
              <col style={{ width: '20rem' }} />
            </colgroup>
            <thead>
              <tr>
                <th>제목</th>
                <th>작성자</th>
                <th>작성일</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <ListSkeletonRows colSpan={COLUMN_COUNT} />}

              {!isLoading && error && (
                <ListErrorRow colSpan={COLUMN_COUNT} message={error} onRetry={() => fetchList(0, 100)} />
              )}

              {!isLoading && !error && list.length === 0 && (
                <ListEmptyRow
                  colSpan={COLUMN_COUNT}
                  variant="no-data"
                  title="등록된 공지사항이 없습니다"
                  subtitle="새로운 공지가 등록되면 이곳에 표시됩니다"
                />
              )}

              {!isLoading && !error && list.length > 0 && filtered.length === 0 && (
                <ListEmptyRow
                  colSpan={COLUMN_COUNT}
                  variant="no-results"
                  title="조건에 맞는 항목이 없습니다"
                  subtitle="검색어를 조정해 보세요"
                  actionLabel="검색 초기화"
                  onAction={() => setSearch('')}
                />
              )}

              {!isLoading &&
                !error &&
                pagedList.map((item) => (
                  <tr key={item.id} onClick={() => navigate(ROUTES.NOTICE_DETAIL(item.id))}>
                    <td>{item.title}</td>
                    <td className="list-page__secondary">{maskName(item.authorName)}</td>
                    <td className="list-page__secondary list-page__mono">
                      {formatDate(item.createdAt)}
                      <ListRowChevron />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="list-page__footer">
          <span className="list-page__count">
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

export { NoticeTable }
