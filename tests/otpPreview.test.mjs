import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkPreviewCode, createPreviewChallenge, CODE_LIFETIME, RESEND_COOLDOWN, MAX_ATTEMPTS } from '../src/services/otpPreview.ts'

test('request creates an email-specific six-digit code with expiry and resend timing', () => {
  const challenge = createPreviewChallenge('reviewer@example.com', undefined, 1000)
  assert.match(challenge.code, /^\d{6}$/)
  assert.equal(challenge.email, 'reviewer@example.com')
  assert.equal(challenge.expiresAt, 1000 + CODE_LIFETIME)
  assert.equal(challenge.resendAt, 1000 + RESEND_COOLDOWN)
  assert.equal(challenge.attempts, 0)
})

test('a successful verification consumes the code without mutating the original challenge', () => {
  const challenge = createPreviewChallenge('reviewer@example.com', undefined, 1000)
  const result = checkPreviewCode(challenge, challenge.code, 1001)
  assert.equal(result.error, undefined)
  assert.equal(result.challenge.used, true)
  assert.equal(challenge.used, false)
  assert.match(checkPreviewCode(result.challenge, challenge.code, 1002).error, /already been used/)
})

test('expired codes are rejected even when the entered code is correct', () => {
  const challenge = createPreviewChallenge('reviewer@example.com', undefined, 1000)
  assert.match(checkPreviewCode(challenge, challenge.code, challenge.expiresAt).error, /expired/)
})

test('incomplete input does not spend an attempt, and five wrong codes require a replacement', () => {
  let challenge = createPreviewChallenge('reviewer@example.com', undefined, 1000)
  const incomplete = checkPreviewCode(challenge, '12', 1001)
  assert.match(incomplete.error, /all 6 digits/)
  assert.equal(incomplete.challenge.attempts, 0)
  const wrong = challenge.code === '111111' ? '222222' : '111111'
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) challenge = checkPreviewCode(challenge, wrong, 1001).challenge
  assert.match(checkPreviewCode(challenge, challenge.code, 1002).error, /Too many incorrect/)
  const replacement = createPreviewChallenge(challenge.email, challenge.code, 2000)
  assert.equal(replacement.attempts, 0)
  assert.equal(checkPreviewCode(replacement, replacement.code, 2001).error, undefined)
})

test('resend replaces the previous code and starts fresh expiry and cooldown periods', () => {
  const original = createPreviewChallenge('reviewer@example.com', undefined, 1000)
  const next = createPreviewChallenge(original.email, original.code, original.resendAt)
  assert.notEqual(original.code, next.code)
  assert.match(checkPreviewCode(next, original.code, original.resendAt + 1).error, /does not match/)
  assert.equal(next.expiresAt, original.resendAt + CODE_LIFETIME)
  assert.equal(next.resendAt, original.resendAt + RESEND_COOLDOWN)
})
