import { httpClient } from './httpClient'

let csrfInitialization: Promise<void> | null = null

function hasCsrfCookie(): boolean {
  return typeof document !== 'undefined' && document.cookie
    .split('; ')
    .some((cookie) => cookie.startsWith('XSRF-TOKEN='))
}

export function initializeCsrfProtection(): Promise<void> {
  if (hasCsrfCookie()) return Promise.resolve()
  if (csrfInitialization) return csrfInitialization

  csrfInitialization = httpClient
    .get('/auth/csrf')
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      csrfInitialization = null
    })

  return csrfInitialization
}
