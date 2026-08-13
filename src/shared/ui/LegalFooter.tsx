import { Link } from 'react-router-dom'
import { ROUTES } from '@/core/navigation/routes'
import './LegalFooter.css'

interface LegalFooterProps {
  showSystemStatus?: boolean
}

function LegalFooter({ showSystemStatus = false }: LegalFooterProps) {
  return (
    <footer className="legal-footer">
      <span className={showSystemStatus ? 'legal-footer__status' : undefined}>
        {showSystemStatus ? 'SYSTEM OPERATIONAL' : '© 2026 CELLNEX'}
      </span>
      <Link to={ROUTES.PRIVACY}>개인정보처리방침</Link>
      <span>CELLNEX v1.0</span>
    </footer>
  )
}

export { LegalFooter }
