export function maskName(name: string): string {
  const normalized = name.trim()
  if (normalized.length <= 1) return normalized ? '*' : ''
  if (normalized.length === 2) return `${normalized[0]}*`
  return `${normalized[0]}${'*'.repeat(normalized.length - 2)}${normalized.at(-1)}`
}

export function maskEmail(email: string): string {
  const [localPart, domain, ...rest] = email.trim().split('@')
  if (!localPart || !domain || rest.length > 0) return email

  const visibleLength = localPart.length >= 3 ? 2 : 1
  const visible = localPart.slice(0, visibleLength)
  const maskedLength = Math.max(1, localPart.length - visibleLength)
  return `${visible}${'*'.repeat(maskedLength)}@${domain}`
}
