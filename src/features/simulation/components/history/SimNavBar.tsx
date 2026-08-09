import { useState } from 'react'
import SimControlPanel from './SimControlPanel'
// 1200 기준 구 CSS는 history/SimNavBar.css로 이동됨 — 1400 기준으로 새로 만들 것

const TABS = ['전체', '대기', '촬영', '분석', '완료'] as const

interface SimNavBarProps {
  activeTab: number
  onTabChange: (index: number) => void
}

function SimNavBar({ activeTab, onTabChange }: SimNavBarProps) {
  const [isControlOpen, setIsControlOpen] = useState(false)

  return (
    <div className="sim-nav">
      <div className="sim-nav__track">
        <div
          className="sim-nav__indicator"
          style={{ transform: `translateX(calc(${activeTab} * 7.7143rem))` }}
        />
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`sim-nav__tab${activeTab === i ? ' sim-nav__tab--active' : ''}`}
            onClick={() => onTabChange(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="sim-nav__control-wrapper">
        <button
          className="sim-nav__control"
          aria-label="상태 제어"
          onClick={() => setIsControlOpen(v => !v)}
        />
        {isControlOpen && (
          <div className="sim-nav__control-popover">
            <SimControlPanel onClose={() => setIsControlOpen(false)} />
          </div>
        )}
      </div>
    </div>
  )
}

export { SimNavBar }
