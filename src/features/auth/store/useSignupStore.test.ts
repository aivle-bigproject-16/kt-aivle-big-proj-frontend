import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '../services/authService'
import { useSignupStore } from './useSignupStore'

describe('useSignupStore email verification', () => {
  beforeEach(() => useSignupStore.getState().actions.reset())
  afterEach(() => vi.restoreAllMocks())

  it('records which email received a code and which email was verified', async () => {
    vi.spyOn(authService, 'sendEmailCode').mockResolvedValue(undefined as never)
    vi.spyOn(authService, 'verifyEmailCode').mockResolvedValue('인증이 완료되었습니다.' as never)

    await useSignupStore.getState().actions.sendEmailCode('user@example.com')
    expect(useSignupStore.getState().codeSentTo).toBe('user@example.com')

    await expect(
      useSignupStore.getState().actions.verifyEmailCode('user@example.com', '123456'),
    ).resolves.toBe(true)
    expect(useSignupStore.getState().verifiedEmail).toBe('user@example.com')
  })

  it('invalidates verification when the email changes', async () => {
    vi.spyOn(authService, 'verifyEmailCode').mockResolvedValue('인증이 완료되었습니다.' as never)
    await useSignupStore.getState().actions.verifyEmailCode('before@example.com', '123456')

    useSignupStore.getState().actions.invalidateEmailVerification()

    expect(useSignupStore.getState().verifiedEmail).toBeNull()
    expect(useSignupStore.getState().codeSentTo).toBeNull()
  })
})
