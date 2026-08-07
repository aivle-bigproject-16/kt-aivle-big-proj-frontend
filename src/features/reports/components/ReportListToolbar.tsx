import './ReportListToolbar.css'
import { ReportTypeToggle } from './ReportTypeToggle'
import type { ReportStatus } from '../types'

interface StatusChipCounts {
  total: number
  completed: number
  pending: number
  failed: number
}

interface ReportListToolbarProps {
  statusFilter: ReportStatus | null
  onStatusFilterChange: (status: ReportStatus | null) => void
  counts: StatusChipCounts
  sortOrder: 'desc' | 'asc'
  onSortOrderChange: (order: 'desc' | 'asc') => void
  search: string
  onSearchChange: (value: string) => void
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5b5f63" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
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

function StatusChip({
  label,
  count,
  active,
  marker,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  marker?: 'pending' | 'failed'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={active ? 'report-list-toolbar__chip report-list-toolbar__chip--active' : 'report-list-toolbar__chip'}
      onClick={onClick}
    >
      {marker === 'pending' && <span className="report-list-toolbar__chip-dot" />}
      {marker === 'failed' && <span className="report-list-toolbar__chip-triangle" />}
      <span>{label}</span>
      <span className="report-list-toolbar__chip-count">{count}</span>
    </button>
  )
}

function ReportListToolbar({
  statusFilter,
  onStatusFilterChange,
  counts,
  sortOrder,
  onSortOrderChange,
  search,
  onSearchChange,
}: ReportListToolbarProps) {
  return (
    <div className="report-list-toolbar">
      <div className="report-list-toolbar__filters">
        <ReportTypeToggle />
        <span className="report-list-toolbar__divider" />
        <div className="report-list-toolbar__chips">
          <StatusChip
            label="전체"
            count={counts.total}
            active={statusFilter === null}
            onClick={() => onStatusFilterChange(null)}
          />
          <StatusChip
            label="완료"
            count={counts.completed}
            active={statusFilter === 'COMPLETED'}
            onClick={() => onStatusFilterChange('COMPLETED')}
          />
          <StatusChip
            label="대기중"
            count={counts.pending}
            active={statusFilter === 'PENDING'}
            marker="pending"
            onClick={() => onStatusFilterChange('PENDING')}
          />
          <StatusChip
            label="실패"
            count={counts.failed}
            active={statusFilter === 'FAILED'}
            marker="failed"
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

        <div className="report-list-toolbar__search">
          <SearchIcon />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="제목 검색"
          />
          {search && (
            <button type="button" className="report-list-toolbar__search-clear" onClick={() => onSearchChange('')} aria-label="검색어 지우기">
              <ClearIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export { ReportListToolbar }
