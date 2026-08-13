import { describe, expect, it } from 'vitest'
import { hasRole } from './access'
import { maskEmail, maskName } from './masking'
import { getPasswordPolicyChecks, isPasswordPolicySatisfied } from './passwordPolicy'

describe('password policy', () => {
  it('accepts the same 8-20 character policy as the backend', () => {
    expect(isPasswordPolicySatisfied('Password123!')).toBe(true)
    expect(isPasswordPolicySatisfied('1234')).toBe(false)
    expect(isPasswordPolicySatisfied('password123')).toBe(false)
  })

  it('reports each requirement independently', () => {
    expect(getPasswordPolicyChecks('Password123!')).toEqual({
      length: true,
      letter: true,
      number: true,
      special: true,
    })
  })
})

describe('personal data masking', () => {
  it('masks names while retaining minimal recognition', () => {
    expect(maskName('홍길동')).toBe('홍*동')
    expect(maskName('김성')).toBe('김*')
  })

  it('masks the email local part', () => {
    expect(maskEmail('admin@test.com')).toBe('ad***@test.com')
    expect(maskEmail('a@test.com')).toBe('a*@test.com')
  })
})

describe('role comparison', () => {
  it('normalizes backend and mock role casing', () => {
    expect(hasRole('ADMIN', 'admin')).toBe(true)
    expect(hasRole('user', 'ADMIN')).toBe(false)
  })
})
