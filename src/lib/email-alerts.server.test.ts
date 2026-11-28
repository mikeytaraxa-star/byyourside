import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/integrations/supabase/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { alertActions, type AlertReminder } from './reminder-alerts'
import { emailRecipient, readEmailState } from './email-alerts'

const { emailSend } = vi.hoisted(() => ({ emailSend: vi.fn() }))
vi.mock('./email-templates/send-email', () => ({ sendTemplateEmail: emailSend }))
import { deliverReminderAlert, handleEmailCommand, loadFamilyEmail } from './email-alerts.server'

type Event = { update_id: number; chat_id: number; raw_update: Json }
function privateEventStore(events: Event[]) {
  // In-memory service client double; query filters mirror the actual private event access path.
  const client = { from: (_table: string) => {
    let filters: ((event: Event) => boolean)[] = []
    let patch: Partial<Event> | null = null
    let latestFirst = false
    let limit = Infinity
    const value = (event: Event, key: string) => {
      if (key === 'update_id') return event.update_id
      if (key === 'chat_id') return event.chat_id
      if (key.endsWith('->>status')) return readEmailState(event.raw_update)?.status
      return readEmailState(event.raw_update)
    }
    const execute = () => {
      let rows = events.filter(event => filters.every(filter => filter(event)))
      if (latestFirst) rows = [...rows].sort((a, b) => b.update_id - a.update_id)
      rows = rows.slice(0, limit)
      if (patch) rows.forEach(row => Object.assign(row, patch))
      return { data: rows.map(row => ({ ...row })), error: null }
    }
    const query = {
      select: (_columns: string) => query,
      eq: (key: string, expected: unknown) => { filters.push(event => value(event, key) === expected); return query },
      not: (key: string, _operator: string, _expected: unknown) => { filters.push(event => value(event, key) != null); return query },
      order: (_column: string, _options: unknown) => { latestFirst = true; return query },
      limit: (count: number) => { limit = count; return query },
      update: (values: Partial<Event>) => { patch = values; return query },
      maybeSingle: async () => { const result = execute(); return { data: result.data[0] ?? null, error: null } },
      then: (resolve: (value: ReturnType<typeof execute>) => unknown) => Promise.resolve(execute()).then(resolve),
    }
    return query
  } }
  return client as unknown as SupabaseClient<Database>
}

const date = '2026-11-28'
const now = new Date(`${date}T08:00:00Z`)
const reminder: AlertReminder = { id: 'pill', local_time: '08:00:00', title: 'Blue pill', detail: null, nudged_on: date, alerted_on: null, confirmed_on: null, critical: false, missed_streak: 0, last_missed_on: null }
beforeEach(() => { vi.resetAllMocks(); emailSend.mockResolvedValue({ sent: true }) })

describe('real enrollment and alert send paths with isolated service doubles', () => {
  it('enrolls, requires emailed proof, resolves the active inbox, then removes it', async () => {
    const events: Event[] = [{ update_id: 1, chat_id: 7, raw_update: {} }]
    const client = privateEventStore(events)
    await handleEmailCommand({ client, chatId: 7, senderId: 9, updateId: 1, rawUpdate: {}, now, command: { kind: 'register', email: 'anna@example.com' } })
    expect(emailSend).toHaveBeenCalledWith('verify-email', 'anna@example.com', expect.objectContaining({ idempotencyKey: 'verify-email-1' }))
    expect(emailRecipient((await loadFamilyEmail(client, 7))?.state ?? null)).toBeNull()
    const sendOptions = emailSend.mock.calls[0]?.[2] as { templateData?: { code?: string } } | undefined
    const code = sendOptions?.templateData?.code?.replaceAll('-', '')
    if (!code) throw new Error('Verification code was not emailed')
    expect(JSON.stringify(events)).not.toContain(code)
    await handleEmailCommand({ client, chatId: 7, senderId: 9, updateId: 2, rawUpdate: {}, now, command: { kind: 'verify', code } })
    expect(emailRecipient((await loadFamilyEmail(client, 7))?.state ?? null)).toBe('anna@example.com')
    events.push({ update_id: 3, chat_id: 7, raw_update: {} })
    await handleEmailCommand({ client, chatId: 7, senderId: 9, updateId: 3, rawUpdate: {}, now, command: { kind: 'off' } })
    expect(emailRecipient((await loadFamilyEmail(client, 7))?.state ?? null)).toBeNull()
  })

  it('does not approve a mailbox from another chat or Telegram account', async () => {
    const hash = createHash('sha256').update('email-verify:7:1:ABCDEFGHJK').digest('hex')
    const client = privateEventStore([{ update_id: 1, chat_id: 7, raw_update: { byyourside_email: { status: 'pending', email: 'anna@example.com', codeHash: hash, requestedBy: 9, requestedAt: now.toISOString(), expiresAt: `${date}T08:15:00.000Z` } } }])
    for (const [chatId, senderId] of [[8, 9], [7, 10]]) {
      if (chatId === undefined || senderId === undefined) throw new Error('Invalid test fixture')
      await handleEmailCommand({ client, chatId, senderId, updateId: 2, rawUpdate: {}, now, command: { kind: 'verify', code: 'ABCDEFGHJK' } })
    }
    expect(emailRecipient((await loadFamilyEmail(client, 7))?.state ?? null)).toBeNull()
  })

  it('keeps the previous inbox when a replacement verification email fails', async () => {
    const client = privateEventStore([
      { update_id: 1, chat_id: 7, raw_update: { byyourside_email: { status: 'active', email: 'old@example.com', requestedAt: `${date}T07:00:00.000Z`, confirmedAt: `${date}T07:01:00.000Z` } } },
      { update_id: 2, chat_id: 7, raw_update: {} },
    ])
    emailSend.mockRejectedValue(new Error('Sender unavailable'))
    await handleEmailCommand({ client, chatId: 7, senderId: 9, updateId: 2, rawUpdate: {}, now, command: { kind: 'register', email: 'anna@example.com' } })
    expect(emailRecipient((await loadFamilyEmail(client, 7))?.state ?? null)).toBe('old@example.com')
  })

  it('starts email and Telegram together at the 15-minute alert without waiting for Telegram', async () => {
    const action = alertActions([reminder], date, 8 * 60 + 15)[0]
    if (!action) throw new Error('Expected a 15-minute alert')
    let release: (value: boolean) => void = () => { throw new Error('Promise not initialized') }
    const telegram = new Promise<boolean>(resolve => { release = resolve })
    const sendTelegram = vi.fn(() => telegram)
    const pending = deliverReminderAlert({ action, reminder, circleId: 'family', date, recipient: 'anna@example.com', sendTelegram })
    expect(sendTelegram).toHaveBeenCalledOnce()
    expect(emailSend).toHaveBeenCalledWith('reminder-alert', 'anna@example.com', expect.objectContaining({ templateData: expect.objectContaining({ scheduledTime: '08:00' }) }))
    release(true)
    expect(await pending).toEqual({ telegramSent: true, emailStatus: 'sent' })
  })

  it('emails the stronger alert after two consecutive unconfirmed important days', async () => {
    const critical = { ...reminder, critical: true, missed_streak: 1, last_missed_on: '2026-11-27' }
    const action = alertActions([critical], date, 495)[0]
    if (!action) throw new Error('Expected a critical alert')
    await deliverReminderAlert({ action, reminder: critical, circleId: 'family', date, recipient: 'anna@example.com', sendTelegram: async () => true })
    expect(emailSend).toHaveBeenCalledWith('reminder-alert', 'anna@example.com', expect.objectContaining({ templateData: expect.objectContaining({ important: true, missedDays: 2 }) }))
  })

  it('never emails confirmed reminders or due-time nudges', async () => {
    expect(alertActions([{ ...reminder, confirmed_on: date }], date, 495)).toEqual([])
    const action = alertActions([{ ...reminder, nudged_on: null }], date, 480)[0]
    if (!action) throw new Error('Expected a due-time nudge')
    await deliverReminderAlert({ action, reminder, circleId: 'family', date, recipient: 'anna@example.com', sendTelegram: async () => true })
    expect(emailSend).not.toHaveBeenCalled()
  })

  it('keeps Telegram working on email failure and email working on Telegram failure', async () => {
    const action = alertActions([reminder], date, 495)[0]
    if (!action) throw new Error('Expected an alert')
    emailSend.mockRejectedValueOnce(new Error('Email unavailable'))
    expect(await deliverReminderAlert({ action, reminder, circleId: 'family', date, recipient: 'anna@example.com', sendTelegram: async () => true })).toEqual({ telegramSent: true, emailStatus: 'failed' })
    expect(await deliverReminderAlert({ action, reminder, circleId: 'family', date, recipient: 'anna@example.com', sendTelegram: async () => { throw new Error('Telegram unavailable') } })).toEqual({ telegramSent: false, emailStatus: 'sent' })
  })

  it('uses the same email event key when a failed Telegram attempt is retried', async () => {
    const action = alertActions([reminder], date, 495)[0]
    if (!action) throw new Error('Expected an alert')
    const args = { action, reminder, circleId: 'family', date, recipient: 'anna@example.com', sendTelegram: async () => false }
    await deliverReminderAlert(args)
    await deliverReminderAlert(args)
    expect(emailSend.mock.calls[0]?.[2]?.idempotencyKey).toBe(emailSend.mock.calls[1]?.[2]?.idempotencyKey)
    expect(emailSend.mock.calls[0]?.[2]?.idempotencyKey).toContain('reminder-alert-family-pill-2026-11-28-alert-')
  })

  it('treats suppression as a normal outcome without retrying', async () => {
    const action = alertActions([reminder], date, 495)[0]
    if (!action) throw new Error('Expected an alert')
    emailSend.mockResolvedValue({ sent: false, reason: 'recipient_suppressed' })
    expect(await deliverReminderAlert({ action, reminder, circleId: 'family', date, recipient: 'anna@example.com', sendTelegram: async () => true })).toEqual({ telegramSent: true, emailStatus: 'suppressed' })
    expect(emailSend).toHaveBeenCalledOnce()
  })
})