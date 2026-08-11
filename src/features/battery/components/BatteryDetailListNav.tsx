import { Link } from 'react-router-dom'
import { ROUTES } from '@/core/navigation/routes'
import './BatteryDetailListNav.css'

/** 배터리 목록으로 가는 버튼 — 배터리 상세 최상단에 위치 */
function BatteryDetailListNav() {
  return (
    <Link to={ROUTES.BATTERY} className="battery-detail-list-nav">
      <svg style={{ width: '0.8rem', height: '1.4rem' }} viewBox="0 0 9 19" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7.93238 2.91699L0.933594 9.91578L7.93238 16.9146"
          stroke="#5B5F63"
          strokeWidth="1.86634"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>배터리 목록</span>
    </Link>
  )
}

export { BatteryDetailListNav }
