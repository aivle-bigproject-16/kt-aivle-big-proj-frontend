export function hasRole(currentRole: string | null, expectedRole: string): boolean {
  return currentRole?.toUpperCase() === expectedRole.toUpperCase()
}
