import { Link } from 'react-router-dom'
import { ROUTES } from '@/core/navigation/routes'
import './ForbiddenPage.css'

function ForbiddenPage() {
  return (
    <main className="forbidden-page">
      <span className="forbidden-page__code">403</span>
      <h1>접근 권한이 없습니다</h1>
      <p>관리자 전용 기능입니다. 권한이 필요하면 시스템 관리자에게 요청해 주세요.</p>
      <Link to={ROUTES.DASHBOARD}>대시보드로 이동</Link>
    </main>
  )
}

export default ForbiddenPage
