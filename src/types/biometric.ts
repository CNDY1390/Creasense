export interface BiometricAuthOptions {
  title?: string
  subtitle?: string
  description?: string
  reason?: string
}

export interface BiometricAuthResult {
  success: boolean
  error?: string
}
