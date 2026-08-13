import { create } from 'zustand'
import { authService } from '../services/authService'
import type { SignupRequest } from '../types'
import type { AsyncState } from '@/shared/types/store'

interface SignupState extends AsyncState {
  isDone: boolean
  isSendingCode: boolean
  isVerifyingCode: boolean
  codeSentTo: string | null
  verifiedEmail: string | null
  emailVerificationError: string | null
}

interface SignupActions {
  actions: {
    signup: (body: SignupRequest) => Promise<void>
    sendEmailCode: (email: string) => Promise<void>
    verifyEmailCode: (email: string, code: string) => Promise<boolean>
    invalidateEmailVerification: () => void
    reset: () => void
  }
}

const initialState: SignupState = {
  isLoading: false,
  isDone: false,
  isSendingCode: false,
  isVerifyingCode: false,
  codeSentTo: null,
  verifiedEmail: null,
  emailVerificationError: null,
  error: null,
}

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}

export const useSignupStore = create<SignupState & SignupActions>((set) => ({
  ...initialState,
  actions: {
    signup: async (body) => {
      set({ isLoading: true, error: null })
      try {
        await authService.signup(body)
        set({ isLoading: false, isDone: true })
      } catch (error) {
        set({ error: errorMessage(error, '회원가입에 실패했습니다.'), isLoading: false })
      }
    },

    sendEmailCode: async (email) => {
      set({ isSendingCode: true, emailVerificationError: null })
      try {
        await authService.sendEmailCode({ email })
        set({
          isSendingCode: false,
          codeSentTo: email,
          verifiedEmail: null,
        })
      } catch (error) {
        set({
          isSendingCode: false,
          emailVerificationError: errorMessage(error, '인증번호 발송에 실패했습니다.'),
        })
        throw error
      }
    },

    verifyEmailCode: async (email, code) => {
      set({ isVerifyingCode: true, emailVerificationError: null })
      try {
        await authService.verifyEmailCode({ email, code })
        set({ isVerifyingCode: false, verifiedEmail: email })
        return true
      } catch (error) {
        set({
          isVerifyingCode: false,
          verifiedEmail: null,
          emailVerificationError: errorMessage(error, '인증번호가 일치하지 않거나 만료되었습니다.'),
        })
        return false
      }
    },

    invalidateEmailVerification: () => set({
      codeSentTo: null,
      verifiedEmail: null,
      emailVerificationError: null,
    }),

    reset: () => set(initialState),
  },
}))
