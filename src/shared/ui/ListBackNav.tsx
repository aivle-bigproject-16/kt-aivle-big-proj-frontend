import { Link } from 'react-router-dom'
import './ListBackNav.css'

interface ListBackNavProps {
  to: string
  label: string
}

/** 목록으로 돌아가는 버튼 — 상세 페이지 최상단에 위치한다 */
function ListBackNav({ to, label }: ListBackNavProps) {
  return (
    <Link to={to} className="list-back-nav">
      <svg width="8" height="14" viewBox="0 0 9 19" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7.93238 2.91699L0.933594 9.91578L7.93238 16.9146"
          stroke="#5B5F63"
          strokeWidth="1.86634"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </Link>
  )
}

export { ListBackNav }
