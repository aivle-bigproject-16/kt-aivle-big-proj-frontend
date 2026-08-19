import '@/shared/ui/ListPageShell.css'
import './ReportListToolbar.css'
import { ReportTypeToggle } from './ReportTypeToggle'
import { FilterChip } from '@/shared/ui/FilterChip'
import { SearchBox } from '@/shared/ui/SearchBox'
import type { ReportStatus } from '../types'



interface ReportListToolbarProps {
  statusFilter: ReportStatus | null
  onStatusFilterChange: (status: ReportStatus | null) => void
  sortOrder: 'desc' | 'asc'
  onSortOrderChange: (order: 'desc' | 'asc') => void
  search: string
  onSearchChange: (value: string) => void
}

function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5b5f63" strokeWidth="1.6">
      <path d="M7 4v16M4 17l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ReportListToolbar({
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
  search,
  onSearchChange,
}: ReportListToolbarProps) {
  return (
    <div className="list-page__toolbar">
      <div className="report-list-toolbar__filters">
        <ReportTypeToggle />
        <span className="report-list-toolbar__divider" />
        <div className="report-list-toolbar__chips">
          <FilterChip
            label="전체"
            active={statusFilter === null}
            onClick={() => onStatusFilterChange(null)}
          />
          <FilterChip
            label="완료"
            active={statusFilter === 'COMPLETED'}
            onClick={() => onStatusFilterChange('COMPLETED')}
          />
          <FilterChip
            label="대기중"
            active={statusFilter === 'PENDING'}
            marker={{ shape: 'dot', color: '#13777c' }}
            onClick={() => onStatusFilterChange('PENDING')}
          />
          <FilterChip
            label="실패"
            active={statusFilter === 'FAILED'}
            marker={{ shape: 'triangle', color: '#dc2626' }}
            onClick={() => onStatusFilterChange('FAILED')}
          />
        </div>
      </div>

      <div className="report-list-toolbar__actions">
        <button
          type="button"
          className="report-list-toolbar__sort"
          onClick={() => onSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')}
        >
          <SortIcon />
          <span>{sortOrder === 'desc' ? '최신순' : '오래된순'}</span>
          <ChevronDownIcon />
        </button>

        <SearchBox value={search} onChange={onSearchChange} placeholder="제목 검색" />
      </div>
    </div>
  )
}

export { ReportListToolbar }
