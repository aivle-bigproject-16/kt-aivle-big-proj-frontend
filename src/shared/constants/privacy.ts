export const PRIVACY_POLICY_VERSION = '2026-08-13'
export const PRIVACY_POLICY_EFFECTIVE_DATE = '2026년 8월 13일'

export const PRIVACY_CONTACT = {
  officer: import.meta.env.VITE_PRIVACY_OFFICER_NAME || '배포 전 개인정보 보호책임자 지정 필요',
  email: import.meta.env.VITE_PRIVACY_CONTACT_EMAIL || '배포 환경 설정 필요',
  phone: import.meta.env.VITE_PRIVACY_CONTACT_PHONE || '배포 환경 설정 필요',
}

export const isPrivacyContactConfigured = Object.values(PRIVACY_CONTACT).every(
  (value) => !value.includes('필요'),
)
