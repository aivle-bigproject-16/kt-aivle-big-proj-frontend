import './SimulationNav.css'

const TABS = ['전체', '대기', '촬영', '분석', '완료']

interface SimulationNavProps {
  activeIndex: number
  onChange: (index: number) => void
}

/** 시뮬레이션 내비게이션 — 메인 영역 최상단 컨테이너.
   탭 컨테이너(450×50) 안에 슬롯 5개(각 90 폭)를 두고, 그 안에 탭(80×40, 곡률 6px)을
   중앙 배치한다. 선택된 탭 뒤의 흰 인디케이터가 옆으로 슬라이드하며 이동한다 */
function SimulationNav({ activeIndex, onChange }: SimulationNavProps) {
  return (
    <div className="simulation-nav">
      <div className="simulation-nav__tabs">
        <span
          className="simulation-nav__indicator"
          style={{ transform: `translateX(${activeIndex * 9}rem)` }}
        />
        {TABS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`simulation-nav__tab${i === activeIndex ? ' simulation-nav__tab--active' : ''}`}
            onClick={() => onChange(i)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export { SimulationNav }
