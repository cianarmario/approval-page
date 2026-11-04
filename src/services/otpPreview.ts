// A browser-only preview. Real delivery and authentication belong on the server.
export const CODE_LIFETIME = 10 * 60 * 1000
export const RESEND_COOLDOWN = 30 * 1000
export const MAX_ATTEMPTS = 5

export interface PreviewChallenge {
  email: string
  code: string
  expiresAt: number
  resendAt: number
  attempts: number
  used: boolean
}

export function createPreviewChallenge(email: string, previousCode?: string, now = Date.now()): PreviewChallenge {
  let code = String(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000)
  if (code === previousCode) code = String(100000 + (Number(code) - 100000 + 1) % 900000)
  return { email, code, expiresAt: now + CODE_LIFETIME, resendAt: now + RESEND_COOLDOWN, attempts: 0, used: false }
}

export function checkPreviewCode(challenge: PreviewChallenge, code: string, now = Date.now()): { challenge: PreviewChallenge; error?: string } {
  if (challenge.used) return { challenge, error: 'This code has already been used. Select Resend Code for a new one.' }
  if (now >= challenge.expiresAt) return { challenge, error: 'Your code has expired. Select Resend Code to get a new one.' }
  if (challenge.attempts >= MAX_ATTEMPTS) return { challenge, error: 'Too many incorrect attempts. Select Resend Code to try again.' }
  if (!/^\d{6}$/.test(code)) return { challenge, error: 'Enter all 6 digits of your verification code.' }
  if (code !== challenge.code) {
    const next = { ...challenge, attempts: challenge.attempts + 1 }
    const remaining = MAX_ATTEMPTS - next.attempts
    return { challenge: next, error: remaining > 0 ? `That code does not match. Try again. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.` : 'Too many incorrect attempts. Select Resend Code to try again.' }
  }
  return { challenge: { ...challenge, used: true } }
}
