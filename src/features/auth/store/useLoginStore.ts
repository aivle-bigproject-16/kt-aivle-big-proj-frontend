import { create } from 'zustand'
import { authService } from '../services/authService'
import type { LoginRequest } from '../types'
import type { AsyncState } from '@/shared/types/store'

interface LoginState extends AsyncState {
  name: string | null
  role: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  isRestoring: boolean
}

interface LoginActions {
  actions: {
    login: (body: LoginRequest) => Promise<void>
    restoreSession: () => Promise<void>
    logout: () => Promise<void>
    reset: () => void
  }
}

const initialState: LoginState = {
  name: null,
  role: null,
  isAuthenticated: false,
  isInitialized: false,
  isRestoring: false,
  isLoading: false,
  error: null,
}

const signedOutState: LoginState = {
  ...initialState,
  isInitialized: true,
}

export const useLoginStore = create<LoginState & LoginActions>((set, get) => ({
  ...initialState,
  actions: {
    login: async (body) => {
      set({ isLoading: true, error: null })
      try {
        const res = await authService.login(body)
        set({
          name: res.data.name,
          role: res.data.role,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
        })
      } catch {
        set({ error: '로그인에 실패했습니다.', isInitialized: true, isLoading: false })
      }
    },

    restoreSession: async () => {
      if (get().isInitialized || get().isRestoring) return
      set({ isRestoring: true })
      try {
        const profile = await authService.me()
        set({
          name: profile.name,
          role: profile.role,
          isAuthenticated: true,
          isInitialized: true,
          isRestoring: false,
          error: null,
        })
      } catch {
        set(signedOutState)
      }
    },

    logout: async () => {
      try {
        await authService.logout()
      } finally {
        set(signedOutState)
      }
    },

    reset: () => set(signedOutState),
  },
}))
