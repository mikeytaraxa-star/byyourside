import { describe, expect, it } from 'vitest'
import { canVerifyEmail, emailCooldown, emailRecipient, parseEmailCommand, readEmailState, shouldEmailAlert, type EmailState } from './email-alerts'

const pending: EmailState = { status: 'pending', email: 'anna@example.com', codeHash: 'a'.repeat(64), requestedAt: '2026-11-28T08:00:00.000Z', expiresAt: '2026-11-28T08:15:00.000Z', requestedBy: 7 }
describe('email alert consent and commands', () => {
  it('parses /email anna@example.com without enabling the inbox', () => {
    expect(parseEmailCommand('/email anna@example.com')).toEqual({ kind: 'register', email: 'anna@example.com' })
    expect(emailRecipient(pending)).toBeNull()
  })
  it('supports Telegram group bot suffixes and normalizes approval codes', () => {
    expect(parseEmailCommand('/email@bysappbot verify abcde-fghjk')).toEqual({ kind: 'verify', code: 'ABCDEFGHJK' })
  })
  it('rejects malformed addresses instead of accepting arbitrary recipients', () => {
    expect(parseEmailCommand('/email anna')).toEqual({ kind: 'invalid' })
    expect(parseEmailCommand('/email anna@example.com other@example.com')).toEqual({ kind: 'invalid' })
    expect(parseEmailCommand('/emailing anna@example.com')).toBeNull()
  })
  it('requires mailbox approval from the same Telegram account within 15 minutes', () => {
    expect(canVerifyEmail(pending, 7, new Date('2026-11-28T08:14:59Z'))).toBe(true)
    expect(canVerifyEmail(pending, 7, new Date('2026-11-28T08:15:00Z'))).toBe(false)
    expect(canVerifyEmail(pending, 8, new Date('2026-11-28T08:10:00Z'))).toBe(false)
  })
  it('sends email only for alert and critical events, not nudges', () => {
    expect(shouldEmailAlert('alert', 'anna@example.com')).toBe(true)
    expect(shouldEmailAlert('critical', 'anna@example.com')).toBe(true)
    expect(shouldEmailAlert('nudge', 'anna@example.com')).toBe(false)
    expect(shouldEmailAlert('summary', 'anna@example.com')).toBe(false)
    expect(shouldEmailAlert('alert', null)).toBe(false)
  })
  it('removes the recipient when /email off is recorded', () => {
    expect(parseEmailCommand('/email off')).toEqual({ kind: 'off' })
    expect(emailRecipient({ status: 'off', requestedAt: pending.requestedAt })).toBeNull()
  })
  it('rejects invalid stored enrollment data', () => {
    expect(readEmailState({ byyourside_email: { status: 'active', email: 'bad' } })).toBeNull()
    expect(readEmailState({ byyourside_email: pending })).toEqual(pending)
  })
  it('limits repeated verification requests to one per 15 minutes', () => {
    expect(emailCooldown(pending, new Date('2026-11-28T08:14:59Z'))).toBe(true)
    expect(emailCooldown(pending, new Date('2026-11-28T08:15:00Z'))).toBe(false)
  })
})