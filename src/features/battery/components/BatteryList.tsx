import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '@/shared/ui/ListPageShell.css'
import './BatteryList.css'
import { ROUTES } from '@/core/navigation/routes'
import { Pagination } from '@/shared/ui/Pagination'
import { ListSkeletonRows, ListEmptyRow, ListErrorRow } from '@/shared/ui/ListStates'
import { ListRowChevron } from '@/shared/ui/ListRowChevron'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { usePaginatedList } from '@/shared/hooks/usePaginatedList'
import { useBatteryListStore } from '../store/useBatteryListStore'
import { BatteryResultBadge } from './BatteryResultBadge'
import { BatteryListToolbar } from './BatteryListToolbar'
import type { FinalLabel } from '../types'

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

function BatteryList() {
  const navigate = useNavigate()
  const list = useBatteryListStore((s) => s.list)
  const isLoading = useBatteryListStore((s) => s.isLoading)
  const error = useBatteryListStore((s) => s.error)
  const { fetchList } = useBatteryListStore((s) => s.actions)

  const [resultFilter, setResultFilter] = useState<FinalLabel | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  useEffect(() => {
    fetchList()
  }, [fetchList])

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

  const { currentPage, setCurrentPage, pagedList, totalPages, rangeStart, rangeEnd } = usePaginatedList(
    filtered,
    `${resultFilter ?? ''}|${debouncedSearch}`,
  )

  const resetFilters = () => {
    setResultFilter(null)
    setSearch('')
  }

  return (
    <section className="list-page">
      <div className="list-page__header">
        <h1 className="list-page__title">배터리 목록</h1>
      </div>

      <BatteryListToolbar
        resultFilter={resultFilter}
        onResultFilterChange={setResultFilter}
        counts={counts}
        search={search}
        onSearchChange={setSearch}
      />

      <div className="list-page__card">
        <div className="battery-list__scroll">
          <table className="list-page__table">
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
                    <td className="list-page__mono">{item.cellSerialNo ?? `CELL-${item.batteryCellId}`}</td>
                    <td>{item.modelName ?? '-'}</td>
                    <td>
                      {item.cellType ? (
                        <span className="battery-list__cell-type-badge">
                          {CELL_TYPE_LABEL[item.cellType] ?? item.cellType}
                        </span>
                      ) : (
                        <span className="list-page__secondary">-</span>
                      )}
                    </td>
                    <td className="list-page__secondary list-page__mono">{formatDateTime(item.latestAnalyzedAt)}</td>
                    <td>
                      {item.latestFinalLabel ? (
                        <BatteryResultBadge label={item.latestFinalLabel} />
                      ) : (
                        <span className="list-page__secondary">-</span>
                      )}
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

export { BatteryList }
