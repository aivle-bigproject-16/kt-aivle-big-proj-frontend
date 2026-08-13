import { useEffect, type ReactNode } from 'react'
import { initializeCsrfProtection } from '@/core/api/csrf'
import { LegalFooter } from '@/shared/ui/LegalFooter'
import './AuthLayout.css'
import authBgPic from '@/assets/authBgPic.png'
import { FlowCellLogo } from '@/features/header/components/FlowCellLogo'

interface AuthLayoutProps {
  children: ReactNode
  variant?: 'default' | 'signup'
}

function AuthLayout({ children, variant = 'default' }: AuthLayoutProps) {
  useEffect(() => {
    void initializeCsrfProtection()
  }, [])

  return (
    <div className={`auth-layout auth-layout--${variant}`}>
      <div
        className="auth-layout__visual"
        style={{ backgroundImage: `url(${authBgPic})` }}
        aria-hidden="true"
      >
        <div className="auth-layout__brand">
          <span className="auth-layout__logo-mark">
            <FlowCellLogo />
          </span>
          <span className="auth-layout__brand-copy">
            <strong>CELLNEX</strong>
            <small>AI BATTERY INSPECTION</small>
          </span>
        </div>

        <div className="auth-layout__message">
          <span className="auth-layout__message-line" />
          <h2>
            정밀 검사의 기준을
            <br />
            하나로 연결합니다.
          </h2>
          <p>AI 기반 배터리 셀 검사와 리포트를 한곳에서 관리하세요.</p>

          <ul className="auth-layout__benefits">
            <li>실시간 공정 추적</li>
            <li>AI 결함 분석</li>
            <li>통합 리포트</li>
          </ul>
        </div>
      </div>
      <div className="auth-layout__panel">
        <main className="auth-layout__form-wrap">{children}</main>
        <div className="auth-layout__footer"><LegalFooter showSystemStatus /></div>
      </div>
    </div>
  )
}

export { AuthLayout }
