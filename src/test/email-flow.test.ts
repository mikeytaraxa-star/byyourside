import { createHash } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { emailSend, database } = vi.hoisted(() => ({ emailSend: vi.fn(), database: { client: {} } }))
vi.mock('@/lib/email-templates/send-email', () => ({ sendTemplateEmail: emailSend }))
vi.mock('@/integrations/supabase/client.server', () => ({ get supabaseAdmin() { return database.client } }))
vi.mock('@tanstack/react-router', () => ({ createFileRoute: () => (options: unknown) => ({ options }) }))
import { Route as webhook } from '@/routes/api/public/telegram/webhook'
import { Route as alerts } from '@/routes/api/public/jobs/reminder-alerts'

type Row = Record<string, unknown>
function serviceStore() {
  const tables: Record<string, Row[]> = {
    telegram_updates: [{update_id:-1,chat_id:7,telegram_user_id:7,text:'/start',created_at:'2026-11-27T00:00:00Z',raw_update:{}}],
    care_members: [{ id: 'member', circle_id: 'circle', telegram_user_id: 7, role: 'owner', revoked_at: null, notify_order: 0, direct_chat_id: null }],
    care_occurrences: [], care_events: [], g2_devices: [],
    care_circles: [{ id: 'circle', telegram_chat_id: 7, summary_time: 'off', timezone: 'UTC', summary_sent_on: null }],
    reminders: [{ id: 'pill', circle_id: 'circle', local_time: '08:00:00', title: 'Blue pill', detail: null, nudged_on: null, alerted_on: null, confirmed_on: null, critical: false, missed_streak: 0, last_missed_on: null }],
  }
  const pathValue = (row: Row, key: string): unknown => key.split(/->>?/).reduce<unknown>((value, part) => value && typeof value === 'object' ? (value as Row)[part] : undefined, row)
  const client = { from: (table: string) => {
    const filters: ((row: Row) => boolean)[] = []
    let operation: { kind: 'upsert' | 'update'; values: Row; conflict?: string; ignore?: boolean } | null = null
    let max = Infinity
    let sort: string | null = null
    let descending = false
    const execute = () => {
      const all = tables[table]
      if (!all) throw new Error('Unknown test table')
      let rows = all.filter(row => filters.every(predicate => predicate(row)))
      if (operation?.kind === 'upsert') {
        const conflict = operation.conflict ?? 'id'
        const existing = all.find(row => row[conflict] === operation?.values[conflict])
        if (existing) { if (!operation.ignore) Object.assign(existing, operation.values); rows = operation.ignore ? [] : [existing] }
        else { const row = { created_at: new Date().toISOString(), ...operation.values }; all.push(row); rows = [row] }
      } else if (operation?.kind === 'update') rows.forEach(row => Object.assign(row, operation?.values))
      if (sort) {
        const key = sort
        rows = [...rows].sort((a, b) => String(a[key]).localeCompare(String(b[key]), undefined, { numeric: true }) * (descending ? -1 : 1))
      }
      return { data: rows.slice(0, max).map(row => ({ ...row })), error: null }
    }
    const query = {
      select: (_columns: string) => query,
      eq: (key: string, value: unknown) => { filters.push(row => pathValue(row, key) === value); return query },
      neq: (key: string, value: unknown) => { filters.push(row => pathValue(row, key) !== value); return query },
      is: (key: string, value: unknown) => { filters.push(row => value === null ? pathValue(row, key) == null : pathValue(row, key) === value); return query },
      in: (key: string, values: unknown[]) => { filters.push(row => values.includes(pathValue(row, key))); return query },
      lt: (key: string, value: string) => { filters.push(row => String(pathValue(row, key)) < value); return query },
      gte: (key: string, value: string) => { filters.push(row => String(pathValue(row, key)) >= value); return query },
      not: (key: string, _operator: string, _value: unknown) => { filters.push(row => pathValue(row, key) != null); return query },
      or: (expression: string) => { filters.push(row => expression.split(',').some(condition => {
        const [key, operator, value] = condition.split('.')
        if (!key) throw new Error('Invalid filter')
        return operator === 'is' ? pathValue(row, key) == null : pathValue(row, key) !== value
      })); return query },
      order: (key: string, options?: { ascending?: boolean }) => { sort = key; descending = options?.ascending === false; return query },
      limit: (value: number) => { max = value; return query },
      update: (values: Row) => { operation = { kind: 'update', values }; return query },
      upsert: (values: Row, options: { onConflict: string; ignoreDuplicates?: boolean }) => {
        operation = { kind: 'upsert', values, conflict: options.onConflict, ignore: options.ignoreDuplicates ?? false }; return query
      },
      single: async () => { const result = execute(); return { data: result.data[0] ?? null, error: null } },
      maybeSingle: async () => { const result = execute(); return { data: result.data[0] ?? null, error: null } },
      then: (resolve: (value: ReturnType<typeof execute>) => unknown) => Promise.resolve(execute()).then(resolve),
    }
    return query
  } }
  return { tables, client }
}

type Endpoint = { options: { server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } } } }
const postWebhook = (webhook as unknown as Endpoint).options.server.handlers.POST
const postAlerts = (alerts as unknown as Endpoint).options.server.handlers.POST
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); vi.resetAllMocks() })

describe('signed Telegram → mailbox approval → scheduled parallel alert', () => {
  it('never stores care facts or replies to a chat that has not started the bot',async()=>{
    vi.stubEnv('TELEGRAM_API_KEY','test-connection-key');vi.stubEnv('LOVABLE_API_KEY','test-managed-key');
    const store=serviceStore();store.tables['telegram_updates']=[];database.client=store.client;
    const send=vi.fn();vi.stubGlobal('fetch',send);
    const signature=createHash('sha256').update('telegram-webhook:test-connection-key').digest('base64url');
    const response=await postWebhook({request:new Request('https://app.example/api/public/telegram/webhook',{method:'POST',headers:{'Content-Type':'application/json','X-Telegram-Bot-Api-Secret-Token':signature},body:JSON.stringify({update_id:1,message:{chat:{id:7},from:{id:7},text:'/remind 14:00 Private pill'}})})});
    expect(response.status).toBe(200);expect(send).not.toHaveBeenCalled();expect(store.tables['telegram_updates']).toHaveLength(0);expect(store.tables['reminders']).toHaveLength(1);
  });
  it('sends welcome buttons and processes a tapped button through the signed command handler', async () => {
    vi.stubEnv('TELEGRAM_API_KEY', 'test-connection-key')
    vi.stubEnv('LOVABLE_API_KEY', 'test-managed-key')
    const store = serviceStore()
    database.client = store.client
    const bodies: Row[] = []
    vi.stubGlobal('fetch', vi.fn(async (_url: unknown, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)) as Row)
      return Response.json({ ok: true, result: { message_id: 1 } })
    }))
    const signature = createHash('sha256').update('telegram-webhook:test-connection-key').digest('base64url')
    const send = (id: number, text: string) => postWebhook({ request: new Request('https://app.example/api/public/telegram/webhook', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Telegram-Bot-Api-Secret-Token': signature },
      body: JSON.stringify({ update_id: id, message: { chat: { id: 7 }, from: { id: 7 }, text } }),
    }) })
    store.tables['telegram_updates']=[];
    expect((await send(1, '/start')).status).toBe(200)
    expect(bodies[0]?.['reply_markup']).toMatchObject({ keyboard: expect.any(Array), resize_keyboard: true, is_persistent: true })
    expect((await send(2, '📝 Add reminder')).status).toBe(200)
    expect(store.tables['reminders']).toHaveLength(1)
    expect(store.tables['telegram_updates']?.find(r=>r['update_id']===2)?.['text']).toBe('/remind')
    expect((await send(3, '🌙 Daily summary')).status).toBe(200)
    expect(store.tables['telegram_updates']?.find(r=>r['update_id']===3)?.['text']).toBe('/summary')
    expect(store.tables['care_circles']?.[0]?.['summary_time']).toBe('off')
    expect(bodies).toHaveLength(3)
    expect(bodies[1]?.['reply_markup']).toBeUndefined()
  })
  it('runs the actual handlers and private persistence path, without sending to real accounts', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-28T08:00:00Z'))
    vi.stubEnv('TELEGRAM_API_KEY', 'test-connection-key')
    vi.stubEnv('LOVABLE_API_KEY', 'test-managed-key')
    vi.stubEnv('LOVABLE_CRON_SECRET', 'test-cron-key')
    const store = serviceStore()
    database.client = store.client
    const telegram = vi.fn(async () => Response.json({ ok: true, result: { message_id: 1 } }))
    vi.stubGlobal('fetch', telegram)
    emailSend.mockResolvedValue({ sent: true })
    const signature = createHash('sha256').update('telegram-webhook:test-connection-key').digest('base64url')
    const message = (id: number, text: string) => new Request('https://app.example/api/public/telegram/webhook', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Telegram-Bot-Api-Secret-Token': signature },
      body: JSON.stringify({ update_id: id, message: { chat: { id: 7 }, from: { id: 7 }, text } }),
    })
    expect((await postWebhook({ request: message(1, '/email anna@example.com') })).status).toBe(200)
    expect(emailSend).toHaveBeenCalledWith('verify-email', 'anna@example.com', expect.any(Object))
    const code = emailSend.mock.calls[0]?.[2]?.templateData?.code as string | undefined
    if (!code) throw new Error('No approval code generated')
    vi.setSystemTime(new Date('2026-11-28T08:01:00Z'))
    expect((await postWebhook({ request: message(2, `/email verify ${code}`) })).status).toBe(200)
    expect(JSON.stringify(store.tables['telegram_updates'])).not.toContain(code)
    expect(JSON.stringify(store.tables['telegram_updates'])).not.toContain(code.replaceAll('-', ''))
    vi.setSystemTime(new Date('2026-11-28T08:15:00Z'))
    const job = () => postAlerts({ request: new Request('https://app.example/api/public/jobs/reminder-alerts', { method: 'POST', headers: { Authorization: 'Bearer test-cron-key' } }) })
    const result = await (await job()).json()
    expect(result).toMatchObject({ ok: true, sent: 1, emailsSent: 1, emailsFailed: 0 })
    expect(emailSend).toHaveBeenCalledWith('reminder-alert', 'anna@example.com', expect.objectContaining({ templateData: expect.objectContaining({ reminder: 'Blue pill', scheduledTime: '08:00' }) }))
    expect(telegram).toHaveBeenCalledTimes(3)
    expect(await (await job()).json()).toMatchObject({ sent: 0, emailsSent: 0 })
    expect(emailSend).toHaveBeenCalledTimes(2)
    expect(telegram).toHaveBeenCalledTimes(3)
  })
})