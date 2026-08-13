import type { ReactNode } from 'react'
import './AuthLayout.css'
import authBgPic from '@/assets/authBgPic.png'
import { FlowCellLogo } from '@/features/header/components/FlowCellLogo'

interface AuthLayoutProps {
  children: ReactNode
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
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
        <footer className="auth-layout__footer">
          <span className="auth-layout__system-status">SYSTEM OPERATIONAL</span>
          <span>CELLNEX v1.0</span>
        </footer>
      </div>
    </div>
  )
}

export { AuthLayout }
