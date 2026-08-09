import { Link } from 'react-router-dom'
import { ROUTES } from '@/core/navigation/routes'
import './IndividualReportListNav.css'

/** 개별 리포트 목록으로 가는 버튼 — IndividualReport 최상단에 위치 */
function IndividualReportListNav() {
  return (
    <Link to={ROUTES.REPORT_INDIVIDUAL} className="individual-report-list-nav">
      <svg width="8" height="14" viewBox="0 0 9 19" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7.93238 2.91699L0.933594 9.91578L7.93238 16.9146"
          stroke="#5B5F63"
          strokeWidth="1.86634"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>개별 리포트 목록</span>
    </Link>
  )
}

export { IndividualReportListNav }
