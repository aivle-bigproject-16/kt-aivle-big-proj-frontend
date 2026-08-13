export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  name: string
  role: string
}

export interface SignupRequest {
  email: string
  password: string
  name: string
  privacyConsent: true
  privacyPolicyVersion: string
}

export type SignupResponse = Record<string, never>
