import '@/shared/ui/ListPageShell.css'
import './BatteryListToolbar.css'
import { FilterChip } from '@/shared/ui/FilterChip'
import { SearchBox } from '@/shared/ui/SearchBox'
import type { FinalLabel } from '../types'

interface ResultChipCounts {
  total: number
  pass: number
  reject: number
  fail: number
}

interface BatteryListToolbarProps {
  resultFilter: FinalLabel | null
  onResultFilterChange: (label: FinalLabel | null) => void
  counts: ResultChipCounts
  search: string
  onSearchChange: (value: string) => void
}

function BatteryListToolbar({
  resultFilter,
  onResultFilterChange,
  counts,
  search,
  onSearchChange,
}: BatteryListToolbarProps) {
  return (
    <div className="list-page__toolbar">
      <div className="battery-list-toolbar__chips">
        <FilterChip
          label="전체"
          count={counts.total}
          active={resultFilter === null}
          onClick={() => onResultFilterChange(null)}
        />
        <FilterChip
          label="PASS"
          count={counts.pass}
          active={resultFilter === 'PASS'}
          marker={{ shape: 'dot', color: '#1e7e34' }}
          onClick={() => onResultFilterChange('PASS')}
        />
        <FilterChip
          label="REJECT"
          count={counts.reject}
          active={resultFilter === 'REJECT'}
          marker={{ shape: 'dot', color: '#d97706' }}
          onClick={() => onResultFilterChange('REJECT')}
        />
        <FilterChip
          label="FAIL"
          count={counts.fail}
          active={resultFilter === 'FAIL'}
          marker={{ shape: 'triangle', color: '#dc2626' }}
          onClick={() => onResultFilterChange('FAIL')}
        />
      </div>

      <SearchBox value={search} onChange={onSearchChange} placeholder="셀 시리얼 검색" />
    </div>
  )
}

export { BatteryListToolbar }
