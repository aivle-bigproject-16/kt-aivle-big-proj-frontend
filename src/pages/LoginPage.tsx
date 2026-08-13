import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/core/navigation/routes'
import { AuthLayout, MailIcon, PasswordField, useLoginStore } from '@/features/auth'

function LoginPage() {
  const navigate = useNavigate()
  const isAuthenticated = useLoginStore((s) => s.isAuthenticated)
  const isLoading = useLoginStore((s) => s.isLoading)
  const error = useLoginStore((s) => s.error)
  const { login } = useLoginStore((s) => s.actions)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.DASHBOARD, { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    login({ email, password })
  }

  return (
    <AuthLayout>
      <span className="auth-eyebrow">SECURE</span>
      <h1 className="auth-title">다시 만나 반갑습니다</h1>
      <p className="auth-subtitle">계정에 로그인하고 검사 대시보드를 확인하세요.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span className="auth-field-label">이메일</span>
          <span className="auth-input-wrap">
            <MailIcon />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              autoComplete="email"
              required
            />
          </span>
        </label>

        <PasswordField
          label="비밀번호"
          value={password}
          onChange={setPassword}
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
        />

        <div className="auth-row">
          <label className="auth-remember">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            로그인 상태 유지
          </label>
          <a className="auth-link" href="#">
            비밀번호를 잊으셨나요?
          </a>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="auth-submit" disabled={isLoading}>
          <span>{isLoading ? '로그인 중...' : '로그인'}</span>
          {!isLoading && <span className="auth-submit__arrow" aria-hidden="true">→</span>}
        </button>
      </form>

      <div className="auth-divider">
        <span>또는</span>
      </div>

      <Link className="auth-secondary-action" to={ROUTES.AUTH_SIGNUP}>
        새 계정 만들기
      </Link>

      <p className="auth-legal">로그인하면 서비스 이용약관과 개인정보 처리방침에 동의하게 됩니다.</p>
    </AuthLayout>
  )
}

export default LoginPage
