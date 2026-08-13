import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/core/navigation/routes'
import { AuthLayout, MailIcon, UserIcon, PasswordField, useSignupStore } from '@/features/auth'
import { PRIVACY_POLICY_VERSION } from '@/shared/constants/privacy'
import { getPasswordPolicyChecks, isPasswordPolicySatisfied } from '@/shared/security/passwordPolicy'

function SignupPage() {
  const navigate = useNavigate()
  const isLoading = useSignupStore((s) => s.isLoading)
  const isDone = useSignupStore((s) => s.isDone)
  const error = useSignupStore((s) => s.error)
  const isSendingCode = useSignupStore((s) => s.isSendingCode)
  const isVerifyingCode = useSignupStore((s) => s.isVerifyingCode)
  const codeSentTo = useSignupStore((s) => s.codeSentTo)
  const verifiedEmail = useSignupStore((s) => s.verifiedEmail)
  const emailVerificationError = useSignupStore((s) => s.emailVerificationError)
  const { signup, sendEmailCode, verifyEmailCode, invalidateEmailVerification, reset } = useSignupStore((s) => s.actions)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const passwordChecks = getPasswordPolicyChecks(password)

  useEffect(() => () => reset(), [reset])

  useEffect(() => {
    if (secondsRemaining <= 0) return
    const timer = window.setInterval(() => {
      setSecondsRemaining((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [secondsRemaining])

  const normalizedEmail = email.trim()
  const isCurrentEmailVerified = verifiedEmail === normalizedEmail
  const isCodeInputVisible = codeSentTo === normalizedEmail && !isCurrentEmailVerified
  const timerText = `${Math.floor(secondsRemaining / 60)}:${String(secondsRemaining % 60).padStart(2, '0')}`

  const handleEmailChange = (value: string) => {
    setEmail(value)
    setVerificationCode('')
    setSecondsRemaining(0)
    invalidateEmailVerification()
  }

  const handleSendEmailCode = async () => {
    if (!normalizedEmail) {
      setConfirmError('이메일을 입력해 주세요.')
      return
    }
    setConfirmError(null)
    try {
      await sendEmailCode(normalizedEmail)
      setVerificationCode('')
      setSecondsRemaining(180)
    } catch {
      // 스토어가 서버 메시지를 보관하므로 화면에서는 추가 처리하지 않는다.
    }
  }

  const handleVerifyEmailCode = async () => {
    if (verificationCode.length !== 6 || secondsRemaining === 0) return
    const verified = await verifyEmailCode(normalizedEmail, verificationCode)
    if (verified) setSecondsRemaining(0)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!isCurrentEmailVerified) {
      setConfirmError('이메일 인증을 완료해 주세요.')
      return
    }
    if (password !== confirmPassword) {
      setConfirmError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (!isPasswordPolicySatisfied(password)) {
      setConfirmError('비밀번호 정책을 모두 충족해 주세요.')
      return
    }
    if (!privacyConsent) {
      setConfirmError('필수 개인정보 수집·이용에 동의해 주세요.')
      return
    }
    setConfirmError(null)
    signup({
      name,
      email,
      password,
      privacyConsent: true,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    })
  }

  if (isDone) {
    return (
      <AuthLayout variant="signup">
        <h1 className="auth-title">가입 완료</h1>
        <p className="auth-subtitle">회원가입이 완료되었습니다. 로그인해 주세요.</p>
        <button type="button" className="auth-submit" onClick={() => navigate(ROUTES.AUTH_LOGIN)}>
          로그인하러 가기
        </button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout variant="signup">
      <h1 className="auth-title">회원가입</h1>
      <p className="auth-subtitle">정보를 입력하고 새 계정을 만드세요</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span className="auth-field-label">이름</span>
          <span className="auth-input-wrap">
            <UserIcon />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              autoComplete="name"
              required
            />
          </span>
        </label>

        <label className="auth-field">
          <span className="auth-field-label">이메일</span>
          <span className="auth-input-wrap">
            <MailIcon />
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="이메일을 입력하세요"
              autoComplete="email"
              required
            />
            <button
              type="button"
              className="auth-field-action"
              onClick={handleSendEmailCode}
              disabled={isSendingCode || isCurrentEmailVerified}
            >
              {isSendingCode ? '발송 중' : codeSentTo === normalizedEmail ? '재발송' : '인증번호 받기'}
            </button>
          </span>
          {isCurrentEmailVerified && <span className="auth-field-success">이메일 인증이 완료되었습니다.</span>}
        </label>

        {isCodeInputVisible && (
          <label className="auth-field">
            <span className="auth-field-label">인증번호</span>
            <span className="auth-input-wrap">
              <input
                type="text"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6자리 인증번호"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
              />
              <span className="auth-verification-timer" aria-live="polite">{timerText}</span>
              <button
                type="button"
                className="auth-field-action"
                onClick={handleVerifyEmailCode}
                disabled={verificationCode.length !== 6 || secondsRemaining === 0 || isVerifyingCode}
              >
                {isVerifyingCode ? '확인 중' : '인증하기'}
              </button>
            </span>
            {secondsRemaining === 0 && <span className="auth-field-help">인증번호가 만료되었습니다. 다시 발송해 주세요.</span>}
          </label>
        )}

        <PasswordField
          label="비밀번호"
          value={password}
          onChange={setPassword}
          placeholder="비밀번호를 입력하세요"
          autoComplete="new-password"
        />

        <ul className="auth-password-policy" aria-label="비밀번호 조건">
          <li data-valid={passwordChecks.length}>8~20자</li>
          <li data-valid={passwordChecks.letter}>영문 포함</li>
          <li data-valid={passwordChecks.number}>숫자 포함</li>
          <li data-valid={passwordChecks.special}>특수문자 포함</li>
        </ul>

        <PasswordField
          label="비밀번호 확인"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="비밀번호를 다시 입력하세요"
          autoComplete="new-password"
        />

        <section className="auth-consent" aria-labelledby="privacy-consent-title">
          <div className="auth-consent__heading">
            <strong id="privacy-consent-title">개인정보 수집·이용 동의</strong>
            <Link to={ROUTES.PRIVACY} target="_blank" rel="noreferrer">전문 보기</Link>
          </div>
          <dl>
            <div><dt>수집 항목</dt><dd>이름, 이메일</dd></div>
            <div><dt>이용 목적</dt><dd>계정 생성, 인증, 권한 관리</dd></div>
            <div><dt>보유 기간</dt><dd>회원 탈퇴 시까지</dd></div>
          </dl>
          <label className="auth-consent__check">
            <input
              type="checkbox"
              checked={privacyConsent}
              onChange={(event) => setPrivacyConsent(event.target.checked)}
              required
            />
            <span>[필수] 개인정보 수집·이용에 동의합니다.</span>
          </label>
          <p className="auth-consent__note">동의를 거부할 수 있으나 미동의 시 계정을 만들 수 없습니다.</p>
        </section>

        {confirmError && <p className="auth-error">{confirmError}</p>}
        {emailVerificationError && <p className="auth-error">{emailVerificationError}</p>}
        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="auth-submit" disabled={isLoading || !isCurrentEmailVerified}>
          {isLoading ? '가입 중...' : '회원가입'}
        </button>
      </form>

      <p className="auth-switch">
        이미 계정이 있으신가요? <Link to={ROUTES.AUTH_LOGIN}>로그인</Link>
      </p>
    </AuthLayout>
  )
}

export default SignupPage
