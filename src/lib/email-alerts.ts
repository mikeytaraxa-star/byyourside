import { z } from 'zod'
import { isPairCode, normalizePairCode } from './pairing'

export const EMAIL_VERIFY_MINUTES = 15
export const EMAIL_STATE_KEY = 'byyourside_email'
const emailAddress = z.email().max(254)
const common = { requestedAt: z.iso.datetime() }
const stateSchema = z.discriminatedUnion('status', [
  z.object({ ...common, status: z.literal('pending'), email: emailAddress, codeHash: z.string().regex(/^[a-f0-9]{64}$/), expiresAt: z.iso.datetime(), requestedBy: z.number().int() }),
  z.object({ ...common, status: z.literal('active'), email: emailAddress, confirmedAt: z.iso.datetime() }),
  z.object({ ...common, status: z.literal('off') }),
])
export type EmailState = z.infer<typeof stateSchema>
export type EmailCommand =
  | { kind: 'status' }
  | { kind: 'off' }
  | { kind: 'register'; email: string }
  | { kind: 'verify'; code: string }
  | { kind: 'invalid' }

export function parseEmailCommand(text: string): EmailCommand | null {
  const match = text.trim().match(/^\/email(?:@\w+)?(?:\s+(.*))?$/i)
  if (!match) return null
  const setting = match[1]?.trim() ?? ''
  if (!setting) return { kind: 'status' }
  if (/^off$/i.test(setting)) return { kind: 'off' }
  const verify = setting.match(/^verify\s+(.+)$/i)
  if (verify) return isPairCode(verify[1] ?? '') ? { kind: 'verify', code: normalizePairCode(verify[1] ?? '') } : { kind: 'invalid' }
  const result = emailAddress.safeParse(setting)
  return result.success ? { kind: 'register', email: result.data } : { kind: 'invalid' }
}

export function readEmailState(raw: unknown): EmailState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const result = stateSchema.safeParse((raw as Record<string, unknown>)[EMAIL_STATE_KEY])
  return result.success ? result.data : null
}

export function emailRecipient(state: EmailState | null) {
  return state?.status === 'active' ? state.email : null
}

export function canVerifyEmail(state: EmailState | null, senderId: number, now: Date) {
  return state?.status === 'pending' && state.requestedBy === senderId && new Date(state.expiresAt).getTime() > now.getTime()
}

export function emailCooldown(state: EmailState | null, now: Date) {
  return state !== null && now.getTime() - new Date(state.requestedAt).getTime() < EMAIL_VERIFY_MINUTES * 60_000
}

export function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  return `${name?.slice(0, 1) ?? ''}***@${domain ?? ''}`
}

/** Only missed-reminder checks, never due nudges or daily digests, send email. */
export function shouldEmailAlert(kind: string, recipient: string | null) {
  return recipient !== null && (kind === 'alert' || kind === 'critical')
}