import { afterEach, describe, expect, it, vi } from 'vitest'

const { send } = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock('@lovable.dev/email-js', () => ({
  sendLovableEmail: send,
  EmailAPIError: class EmailAPIError extends Error {
    code = 'recipient_suppressed'
  },
}))

import { EmailAPIError } from '@lovable.dev/email-js'
import { sendTemplateEmail } from './send-email'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetAllMocks()
})

describe('managed app email sending', () => {
  it('refuses to send without server credentials', async () => {
    vi.stubEnv('LOVABLE_API_KEY', '')
    await expect(sendTemplateEmail('reminder-alert', 'family@example.com')).rejects.toThrow('not configured')
    expect(send).not.toHaveBeenCalled()
  })

  it('renders the registered template and preserves event deduplication', async () => {
    vi.stubEnv('LOVABLE_API_KEY', 'test-only-placeholder')
    send.mockResolvedValue(undefined)
    await expect(sendTemplateEmail('reminder-alert', 'family@example.com', {
      templateData: { reminder: 'Take the blue pill', scheduledTime: '08:00' },
      idempotencyKey: 'reminder-alert-event-123',
    })).resolves.toEqual({ sent: true })
    expect(send).toHaveBeenCalledOnce()
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'family@example.com',
      sender_domain: 'notify.byside.here',
      idempotency_key: 'reminder-alert-event-123',
      html: expect.any(String),
      text: expect.any(String),
    }), expect.any(Object))
  })

  it('does not retry around recipient suppression', async () => {
    vi.stubEnv('LOVABLE_API_KEY', 'test-only-placeholder')
    const error = Object.assign(new Error('Suppressed'), { code: 'recipient_suppressed' })
    Object.setPrototypeOf(error, EmailAPIError.prototype)
    send.mockRejectedValue(error)
    await expect(sendTemplateEmail('reminder-alert', 'family@example.com')).resolves.toEqual({
      sent: false, reason: 'recipient_suppressed',
    })
    expect(send).toHaveBeenCalledOnce()
  })
})