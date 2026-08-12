import type { OverviewView } from '../hooks/useOverviewView'
import './OverviewViewToggle.css'

interface OverviewViewToggleProps {
  view: OverviewView
  onChange: (view: OverviewView) => void
}

const OPTIONS: { value: OverviewView; label: string; hint: string }[] = [
  { value: 'line', label: '공정 라인', hint: '디지털 트윈 라인 뷰로 보기' },
  { value: 'card', label: '요약 카드', hint: '기존 카드 뷰로 보기' },
]

/** 전체탭 본문 뷰 전환 — 공정 라인(트윈)과 기존 요약 카드 사이를 오간다 */
function OverviewViewToggle({ view, onChange }: OverviewViewToggleProps) {
  return (
    <div className="overview-view-toggle" role="group" aria-label="전체탭 보기 방식">
      {OPTIONS.map((option) => {
        const selected = view === option.value
        return (
          <button
            key={option.value}
            type="button"
            className={`overview-view-toggle__option${selected ? ' overview-view-toggle__option--selected' : ''}`}
            aria-pressed={selected}
            title={option.hint}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export { OverviewViewToggle }
