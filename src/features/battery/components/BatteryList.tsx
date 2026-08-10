import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './BatteryList.css'
import { ROUTES } from '@/core/navigation/routes'
import { Pagination } from '@/shared/ui/Pagination'
import { ListSkeletonRows, ListEmptyRow, ListErrorRow } from '@/shared/ui/ListStates'
import { useBatteryListStore } from '../store/useBatteryListStore'
import { BatteryResultBadge } from './BatteryResultBadge'
import { BatteryListToolbar } from './BatteryListToolbar'
import type { FinalLabel } from '../types'

const PAGE_SIZE = 20
const COLUMN_COUNT = 5

const CELL_TYPE_LABEL: Record<string, string> = {
  POUCH: '파우치',
  CYLINDRICAL: '원통형',
}

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

function BatteryList() {
  const navigate = useNavigate()
  const list = useBatteryListStore((s) => s.list)
  const isLoading = useBatteryListStore((s) => s.isLoading)
  const error = useBatteryListStore((s) => s.error)
  const { fetchList } = useBatteryListStore((s) => s.actions)

  const [resultFilter, setResultFilter] = useState<FinalLabel | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // 필터·검색어가 바뀌면 1페이지로 리셋한다. 렌더 도중 이전 값과 비교해 바로 조정 —
  // useEffect를 쓰면 한 번 더 렌더가 도는 것을 피한다 (React 공식 권장 패턴).
  const filterKey = `${resultFilter ?? ''}|${debouncedSearch}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setCurrentPage(1)
  }

  const counts = useMemo(
    () => ({
      total: list.length,
      pass: list.filter((r) => r.latestFinalLabel === 'PASS').length,
      reject: list.filter((r) => r.latestFinalLabel === 'REJECT').length,
      fail: list.filter((r) => r.latestFinalLabel === 'FAIL').length,
    }),
    [list],
  )

  const filtered = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase()
    return list.filter((item) => {
      if (resultFilter && item.latestFinalLabel !== resultFilter) return false
      if (keyword) {
        const serial = (item.cellSerialNo ?? `CELL-${item.batteryCellId}`).toLowerCase()
        if (!serial.includes(keyword)) return false
      }
      return true
    })
  }, [list, resultFilter, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pagedList = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const resetFilters = () => {
    setResultFilter(null)
    setSearch('')
  }

  return (
    <section className="battery-list">
      <div className="battery-list__header">
        <h1 className="battery-list__title">배터리 목록</h1>
      </div>

      <BatteryListToolbar
        resultFilter={resultFilter}
        onResultFilterChange={setResultFilter}
        counts={counts}
        search={search}
        onSearchChange={setSearch}
      />

      <div className="battery-list__card">
        <div className="battery-list__scroll">
          <table className="battery-list__table">
            <colgroup>
              <col style={{ width: '39.6rem' }} />
              <col style={{ width: '24rem' }} />
              <col style={{ width: '16rem' }} />
              <col style={{ width: '26rem' }} />
              <col style={{ width: '28rem' }} />
            </colgroup>
            <thead>
              <tr>
                <th>셀 시리얼</th>
                <th>모델</th>
                <th>셀 유형</th>
                <th>최근 검사</th>
                <th>판정</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <ListSkeletonRows colSpan={COLUMN_COUNT} />}

              {!isLoading && error && (
                <ListErrorRow colSpan={COLUMN_COUNT} message={error} onRetry={() => fetchList()} />
              )}

              {!isLoading && !error && list.length === 0 && (
                <ListEmptyRow
                  colSpan={COLUMN_COUNT}
                  variant="no-data"
                  title="아직 검사된 배터리가 없습니다"
                  subtitle="대시보드에서 시뮬레이션을 실행하면 검사 결과가 이곳에 쌓입니다"
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
                  <tr key={item.batteryCellId} onClick={() => navigate(ROUTES.BATTERY_DETAIL(item.batteryCellId))}>
                    <td className="battery-list__mono">{item.cellSerialNo ?? `CELL-${item.batteryCellId}`}</td>
                    <td>{item.modelName ?? '-'}</td>
                    <td>
                      {item.cellType ? (
                        <span className="battery-list__cell-type-badge">
                          {CELL_TYPE_LABEL[item.cellType] ?? item.cellType}
                        </span>
                      ) : (
                        <span className="battery-list__secondary">-</span>
                      )}
                    </td>
                    <td className="battery-list__secondary battery-list__mono">
                      {formatDateTime(item.latestAnalyzedAt)}
                    </td>
                    <td>
                      {item.latestFinalLabel ? (
                        <BatteryResultBadge label={item.latestFinalLabel} />
                      ) : (
                        <span className="battery-list__secondary">-</span>
                      )}
                      <span className="battery-list__chevron">
                        <ChevronIcon />
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="battery-list__footer">
          <span className="battery-list__count">
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

export { BatteryList }
