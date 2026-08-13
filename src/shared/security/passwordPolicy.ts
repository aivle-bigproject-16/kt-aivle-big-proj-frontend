export const PASSWORD_POLICY_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,20}$/

export interface PasswordPolicyChecks {
  length: boolean
  letter: boolean
  number: boolean
  special: boolean
}

export function getPasswordPolicyChecks(password: string): PasswordPolicyChecks {
  return {
    length: password.length >= 8 && password.length <= 20,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*#?&]/.test(password),
  }
}

export function isPasswordPolicySatisfied(password: string): boolean {
  return PASSWORD_POLICY_PATTERN.test(password)
}
