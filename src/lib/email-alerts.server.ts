import { createHash, timingSafeEqual } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/integrations/supabase/types'
import type { AlertAction, AlertReminder } from './reminder-alerts'
import { canVerifyEmail, emailCooldown, EMAIL_STATE_KEY, EMAIL_VERIFY_MINUTES, maskEmail, readEmailState, shouldEmailAlert, type EmailCommand, type EmailState } from './email-alerts'
import { formatPairCode, newPairCode } from './pairing'
import { sendTemplateEmail } from './email-templates/send-email'
import { EmailAPIError } from '@lovable.dev/email-js'

type Client = SupabaseClient<Database>
const digest = (value: string) => createHash('sha256').update(value).digest('hex')

/** Verified Telegram command events already have private, service-only storage.
 * Enrich those events with enrollment results; do not create email infrastructure tables.
 */
export async function loadFamilyEmail(client: Client, chatId: number) {
  const { data, error } = await client.from('telegram_updates').select('update_id, raw_update')
    .eq('chat_id', chatId).not(`raw_update->${EMAIL_STATE_KEY}`, 'is', null)
    .order('update_id', { ascending: false }).limit(1).maybeSingle()
  if (error) throw new Error('Family email settings could not be read')
  return data ? { ...data, state: readEmailState(data.raw_update) } : null
}

function withState(raw: Json, state: EmailState): Json {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  return { ...source, [EMAIL_STATE_KEY]: state }
}

function emailFailure(error: unknown) {
  if (error instanceof EmailAPIError) {
    // Codes/status only: provider bodies can contain recipient or care details.
    console.error('App email request refused', { code: error.code, status: error.status })
    if (error.code === 'domain_not_verified') return 'The sender domain is still being verified. Please try /email again after verification finishes; Telegram alerts continue.'
    if (error.code === 'emails_disabled') return 'App emails are disabled. Telegram alerts continue; the app owner needs to re-enable email sending.'
    if (error.status === 429) return `Email sending is temporarily limited. Wait at least ${error.retryAfterSeconds ?? 60} seconds before trying again.`
  } else console.error('App email send failed')
  return 'I could not send that email. Your inbox has not been enabled. Please try again later; Telegram alerts continue.'
}

export async function handleEmailCommand(args: {
  client: Client; chatId: number; senderId: number | undefined; updateId: number; rawUpdate: Json; command: EmailCommand; now?: Date
}) {
  const { client, chatId, updateId, rawUpdate, command, senderId } = args
  const now = args.now ?? new Date()
  if (command.kind === 'invalid') return 'Use /email your-address@example.com, /email verify CODE, /email to check, or /email off to remove this chat’s backup inbox.'
  if (senderId === undefined) return 'Please send /email from your own Telegram account so inbox approval can be tied to you.'
  const latest = await loadFamilyEmail(client, chatId)
  const state = latest?.state ?? null
  if (command.kind === 'status') {
    if (state?.status === 'active') return `📧 Backup alerts are enabled for ${maskEmail(state.email)}. Emails accompany 15-minute and important missed-reminder alerts. /email off removes this chat’s backup inbox.`
    if (state?.status === 'pending') return `📧 Approval is pending for ${maskEmail(state.email)}. Use the command in your email within 15 minutes. No reminder details are sent until approved.`
    return '📧 No backup inbox is enabled. Send /email your-address@example.com and approve it using the code sent to your inbox. Use an inbox you own.'
  }
  if (command.kind === 'off') {
    const { error } = await client.from('telegram_updates').update({ raw_update: withState(rawUpdate, { status: 'off', requestedAt: state?.requestedAt ?? now.toISOString() }) }).eq('update_id', updateId).eq('chat_id', chatId)
    return error ? 'I could not remove the backup inbox. Please try again.' : '📧 This chat’s email backup inbox is removed. Telegram alerts continue.'
  }
  if (command.kind === 'verify') {
    if (!latest || !state || state.status !== 'pending' || !canVerifyEmail(state, senderId, now)) return 'That approval has expired, is already used, or belongs to another account. Request a new code with /email your-address@example.com.'
    const hash = digest(`email-verify:${chatId}:${latest.update_id}:${command.code}`)
    if (!timingSafeEqual(Buffer.from(hash), Buffer.from(state.codeHash))) return 'That code does not match. Use the command from your ByYourSide verification email.'
    const active: EmailState = { status: 'active', email: state.email, requestedAt: state.requestedAt, confirmedAt: now.toISOString() }
    const { data, error } = await client.from('telegram_updates').update({ raw_update: withState(latest.raw_update, active) })
      .eq('update_id', latest.update_id).eq('chat_id', chatId).eq(`raw_update->${EMAIL_STATE_KEY}->>status`, 'pending').select('update_id')
    return error || !data?.length ? 'Approval could not be saved. Please check /email and try again.' : `📧 Approved: ${maskEmail(state.email)} will receive 15-minute unconfirmed alerts and important reminders missed on consecutive days, alongside Telegram. Delivery depends on your email provider; ByYourSide is not an emergency service.`
  }
  if (state?.status === 'active' && state.email === command.email) return `📧 ${maskEmail(state.email)} is already approved for this chat.`
  if (emailCooldown(state, now)) return 'A verification request was made recently. Please wait 15 minutes from that request before requesting another; use the code already emailed if it is still valid.'
  const code = newPairCode()
  const pending: EmailState = {
    status: 'pending', email: command.email, requestedBy: senderId, requestedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + EMAIL_VERIFY_MINUTES * 60_000).toISOString(),
    codeHash: digest(`email-verify:${chatId}:${updateId}:${code}`),
  }
  const { error } = await client.from('telegram_updates').update({ raw_update: withState(rawUpdate, pending) }).eq('update_id', updateId).eq('chat_id', chatId)
  if (error) return 'I could not save that request. No email was sent.'
  try {
    const result = await sendTemplateEmail('verify-email', command.email, { templateData: { code: formatPairCode(code) }, idempotencyKey: `verify-email-${updateId}` })
    if (!result.sent) {
      await client.from('telegram_updates').update({ raw_update: rawUpdate }).eq('update_id', updateId).eq('chat_id', chatId)
      return 'This inbox cannot receive ByYourSide app emails because it is suppressed. No backup inbox was enabled; Telegram alerts continue.'
    }
    return `📧 Check ${maskEmail(command.email)} for the approval command (valid 15 minutes), including spam. Send it here from this account. Until approved, no family reminder details go to that inbox. Never share the code.`
  } catch (error) {
    // Restore the original event, preserving any previously approved inbox.
    await client.from('telegram_updates').update({ raw_update: rawUpdate }).eq('update_id', updateId).eq('chat_id', chatId)
    return emailFailure(error)
  }
}

export async function deliverReminderAlert(args: {
  action: AlertAction; reminder: AlertReminder; circleId: string; date: string; recipient: string | null;
  sendTelegram: () => Promise<boolean>
}) {
  const { action, reminder, circleId, date, recipient, sendTelegram } = args
  const email = async () => {
    if (!shouldEmailAlert(action.kind, recipient) || !recipient) return { status: 'skipped' as const }
    try {
      const result = await sendTemplateEmail('reminder-alert', recipient, {
        templateData: { reminder: reminder.title, scheduledTime: reminder.local_time.slice(0, 5), important: reminder.critical, missedDays: action.missedStreak ?? 1 },
        idempotencyKey: `reminder-alert-${circleId}-${action.id}-${date}-${action.kind}-${digest(recipient).slice(0, 16)}`,
      })
      return { status: result.sent ? 'sent' as const : 'suppressed' as const }
    } catch (error) {
      emailFailure(error)
      return { status: 'failed' as const }
    }
  }
  // Start both independently in the same scheduled check; one channel cannot block the other.
  const [telegram, emailResult] = await Promise.allSettled([sendTelegram(), email()])
  return {
    telegramSent: telegram.status === 'fulfilled' && telegram.value,
    emailStatus: emailResult.status === 'fulfilled' ? emailResult.value.status : 'failed' as const,
  }
}