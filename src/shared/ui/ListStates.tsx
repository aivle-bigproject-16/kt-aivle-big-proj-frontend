import './ListStates.css'

const SKELETON_ROW_WIDTHS = [
  [70, 90, 65, 85],
  [62, 75, 68, 60],
  [74, 95, 65, 80],
  [66, 68, 65, 60],
  [70, 88, 65, 80],
  [60, 72, 65, 60],
  [72, 92, 65, 80],
  [64, 70, 65, 60],
]

function ListSkeletonRows({ colSpan }: { colSpan: number }) {
  return (
    <>
      {SKELETON_ROW_WIDTHS.map((widths, i) => (
        <tr key={i} className="list-skeleton-row">
          {Array.from({ length: colSpan }, (_, col) => (
            <td key={col}>
              <span className="list-skeleton-bar" style={{ width: `${widths[col % widths.length]}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function EmptyBoxIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c3c8cd" strokeWidth="2">
      <rect x="4" y="8" width="16" height="12" rx="1.5" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  )
}

function EmptySearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c3c8cd" strokeWidth="2">
      <circle cx="10" cy="10" r="7" />
      <path d="M20 20l-5-5" strokeLinecap="round" />
    </svg>
  )
}

interface ListEmptyRowProps {
  colSpan: number
  variant: 'no-data' | 'no-results'
  title: string
  subtitle: string
  actionLabel?: string
  onAction?: () => void
}

function ListEmptyRow({ colSpan, variant, title, subtitle, actionLabel, onAction }: ListEmptyRowProps) {
  return (
    <tr className="list-state-row">
      <td colSpan={colSpan}>
        <div className="list-state">
          <div className="list-state__icon">
            {variant === 'no-data' ? <EmptyBoxIcon /> : <EmptySearchIcon />}
          </div>
          <p className="list-state__title">{title}</p>
          <p className="list-state__subtitle">{subtitle}</p>
          {actionLabel && onAction && (
            <button
              type="button"
              className={
                variant === 'no-data'
                  ? 'list-state__action list-state__action--filled'
                  : 'list-state__action list-state__action--outline'
              }
              onClick={onAction}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

function ErrorIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
      <path d="M12 3l10 17H2z" strokeLinejoin="round" />
      <path d="M12 10v4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="#dc2626" />
    </svg>
  )
}

interface ListErrorRowProps {
  colSpan: number
  message: string
  onRetry: () => void
}

function ListErrorRow({ colSpan, message, onRetry }: ListErrorRowProps) {
  return (
    <tr className="list-state-row">
      <td colSpan={colSpan}>
        <div className="list-state">
          <div className="list-state__icon list-state__icon--error">
            <ErrorIcon />
          </div>
          <p className="list-state__title">목록을 불러오지 못했습니다</p>
          <p className="list-state__subtitle list-state__subtitle--mono">{message}</p>
          <button type="button" className="list-state__action list-state__action--filled" onClick={onRetry}>
            다시 시도
          </button>
        </div>
      </td>
    </tr>
  )
}

export { ListSkeletonRows, ListEmptyRow, ListErrorRow }
