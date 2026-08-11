import './FilterChip.css'

interface FilterChipMarker {
  shape: 'dot' | 'triangle'
  color: string
}

interface FilterChipProps {
  label: string
  count: number
  active: boolean
  marker?: FilterChipMarker
  onClick: () => void
}

function FilterChip({ label, count, active, marker, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      className={active ? 'filter-chip filter-chip--active' : 'filter-chip'}
      onClick={onClick}
    >
      {marker?.shape === 'dot' && (
        <span className="filter-chip__marker-dot" style={{ background: marker.color }} />
      )}
      {marker?.shape === 'triangle' && (
        <span className="filter-chip__marker-triangle" style={{ borderBottomColor: marker.color }} />
      )}
      <span>{label}</span>
      <span className="filter-chip__count">{count}</span>
    </button>
  )
}

export { FilterChip }
