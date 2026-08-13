import { httpClient } from '@/core/api/httpClient'
import type { ApiResponse } from '@/shared/types/api'
import type {
  EmailSendRequest,
  EmailVerifyRequest,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
} from '../types'

const BASE_URL = '/auth'

export const authService = {
  login: (body: LoginRequest) =>
    httpClient.post<ApiResponse<LoginResponse>>(`${BASE_URL}/login`, body),

  signup: (body: SignupRequest) =>
    httpClient.post<ApiResponse<SignupResponse>>(`${BASE_URL}/signup`, body),

  sendEmailCode: (body: EmailSendRequest) =>
    httpClient.post<void>(`${BASE_URL}/email/send`, body),

  verifyEmailCode: (body: EmailVerifyRequest) =>
    httpClient.post<string>(`${BASE_URL}/email/verify`, body),
}
