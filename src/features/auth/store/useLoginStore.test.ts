import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '../services/authService'
import { useLoginStore } from './useLoginStore'

function resetUninitialized() {
  useLoginStore.setState({
    name: null,
    role: null,
    isAuthenticated: false,
    isInitialized: false,
    isRestoring: false,
    isLoading: false,
    error: null,
  })
}

describe('useLoginStore session restoration', () => {
  beforeEach(resetUninitialized)
  afterEach(() => vi.restoreAllMocks())

  it('restores the authenticated user from the HttpOnly cookie session', async () => {
    vi.spyOn(authService, 'me').mockResolvedValue({
      id: 7,
      email: 'demo@example.com',
      name: 'Demo',
      role: 'ADMIN',
    })

    await useLoginStore.getState().actions.restoreSession()

    expect(useLoginStore.getState()).toMatchObject({
      name: 'Demo',
      role: 'ADMIN',
      isAuthenticated: true,
      isInitialized: true,
      isRestoring: false,
    })
  })

  it('finishes initialization as a guest when the cookie is invalid', async () => {
    vi.spyOn(authService, 'me').mockRejectedValue(new Error('unauthorized'))

    await useLoginStore.getState().actions.restoreSession()

    expect(useLoginStore.getState()).toMatchObject({
      isAuthenticated: false,
      isInitialized: true,
      isRestoring: false,
    })
  })

  it('clears the server cookie and client state on logout', async () => {
    vi.spyOn(authService, 'logout').mockResolvedValue(undefined)
    useLoginStore.setState({
      name: 'Demo',
      role: 'ADMIN',
      isAuthenticated: true,
      isInitialized: true,
    })

    await useLoginStore.getState().actions.logout()

    expect(authService.logout).toHaveBeenCalledOnce()
    expect(useLoginStore.getState()).toMatchObject({
      name: null,
      role: null,
      isAuthenticated: false,
      isInitialized: true,
    })
  })
})
