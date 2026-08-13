import { Link } from 'react-router-dom'
import { ROUTES } from '@/core/navigation/routes'
import { FlowCellLogo } from '@/features/header/components/FlowCellLogo'
import {
  isPrivacyContactConfigured,
  PRIVACY_CONTACT,
  PRIVACY_POLICY_EFFECTIVE_DATE,
  PRIVACY_POLICY_VERSION,
} from '@/shared/constants/privacy'
import './PrivacyPolicyPage.css'

const policySections = [
  {
    id: 'purpose',
    title: '1. 개인정보 처리 목적',
    content: '계정 생성, 사용자 인증, 역할에 따른 검사 시스템 접근 제어를 위해 개인정보를 처리합니다.',
  },
  {
    id: 'items',
    title: '2. 처리하는 개인정보 항목',
    content: '필수 항목은 이름과 이메일입니다. 비밀번호는 복호화할 수 없는 적응형 해시로 변환해 저장합니다.',
  },
  {
    id: 'retention',
    title: '3. 처리 및 보유기간',
    content: '회원 탈퇴 시까지 보유하고, 관계 법령에 별도 보존 의무가 있는 경우 해당 기간 동안 분리 보관합니다.',
  },
  {
    id: 'third-party',
    title: '4. 제3자 제공 및 처리업무 위탁',
    content: '현재 개인정보를 제3자에게 제공하지 않습니다. 제공 또는 위탁이 발생하면 대상과 목적을 사전에 공개합니다.',
  },
  {
    id: 'destruction',
    title: '5. 개인정보의 파기',
    content: '보유기간이 끝나거나 처리 목적이 달성되면 복구할 수 없는 방법으로 지체 없이 파기합니다.',
  },
  {
    id: 'rights',
    title: '6. 정보주체의 권리',
    content: '개인정보 열람, 정정, 삭제, 처리정지와 동의 철회를 요청할 수 있으며 본인 확인 후 처리합니다.',
  },
  {
    id: 'safeguards',
    title: '7. 안전성 확보조치',
    content: '접근권한 통제, 비밀번호 일방향 해시, 전송구간 암호화, CSRF 방어와 보안 로그 점검을 적용합니다.',
  },
]

function PrivacyPolicyPage() {
  return (
    <div className="privacy-page">
      <header className="privacy-page__header">
        <Link className="privacy-page__brand" to={ROUTES.AUTH_LOGIN} aria-label="CELLNEX 로그인으로 이동">
          <FlowCellLogo />
          <span>CELLNEX</span>
        </Link>
        <Link className="privacy-page__back" to={ROUTES.AUTH_LOGIN}>서비스로 돌아가기</Link>
      </header>

      <section className="privacy-page__hero">
        <div>
          <span>PRIVACY POLICY</span>
          <h1>개인정보처리방침</h1>
          <p>CELLNEX는 필요한 개인정보만 처리하고 이용자의 권리를 투명하게 안내합니다.</p>
        </div>
        <dl>
          <div><dt>정책 버전</dt><dd>{PRIVACY_POLICY_VERSION}</dd></div>
          <div><dt>시행일</dt><dd>{PRIVACY_POLICY_EFFECTIVE_DATE}</dd></div>
        </dl>
      </section>

      <main className="privacy-page__content">
        {!isPrivacyContactConfigured && (
          <aside className="privacy-page__deployment-warning" role="status">
            운영 배포 전 개인정보 보호책임자 이름·이메일·전화번호 환경변수를 반드시 설정해야 합니다.
          </aside>
        )}

        <div className="privacy-page__summary">
          <div><strong>최소 수집</strong><span>이름·이메일만 필수 수집</span></div>
          <div><strong>보유기간</strong><span>회원 탈퇴 시까지</span></div>
          <div><strong>권리 보장</strong><span>열람·정정·삭제·처리정지</span></div>
        </div>

        <div className="privacy-page__body">
          <nav aria-label="개인정보처리방침 목차">
            <strong>목차</strong>
            {policySections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
            <a href="#contact">8. 개인정보 보호책임자</a>
          </nav>

          <article>
            {policySections.map((section) => (
              <section id={section.id} key={section.id}>
                <h2>{section.title}</h2>
                <p>{section.content}</p>
              </section>
            ))}
            <section id="contact">
              <h2>8. 개인정보 보호책임자</h2>
              <dl className="privacy-page__contact">
                <div><dt>책임자</dt><dd>{PRIVACY_CONTACT.officer}</dd></div>
                <div><dt>이메일</dt><dd>{PRIVACY_CONTACT.email}</dd></div>
                <div><dt>전화번호</dt><dd>{PRIVACY_CONTACT.phone}</dd></div>
              </dl>
            </section>
            <section>
              <h2>9. 방침 변경</h2>
              <p>내용이 변경되면 시행 전에 서비스 화면을 통해 변경 이유와 적용일을 공개합니다.</p>
            </section>
          </article>
        </div>
      </main>

      <footer className="privacy-page__footer">
        <span>© 2026 CELLNEX</span>
        <span>개인정보처리방침 v{PRIVACY_POLICY_VERSION}</span>
      </footer>
    </div>
  )
}

export default PrivacyPolicyPage
