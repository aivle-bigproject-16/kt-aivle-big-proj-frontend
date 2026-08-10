import './ListPageShell.css'

function ListRowChevron() {
  return (
    <span className="list-page__chevron">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export { ListRowChevron }
