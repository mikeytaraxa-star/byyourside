import { hashToken } from './pairing';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
};
export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });
export const preflight = () => new Response(null, { status: 204, headers: cors });

/** Resolves the paired care circle from the device bearer token. */
export async function deviceCircle(request: Request) {
  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (token.length < 32 || token.length > 128) return null;
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data } = await supabaseAdmin.from('g2_devices').select('id, circle_id').eq('token_hash', await hashToken(token)).maybeSingle();
  if (!data) return null;
  const { data: circle } = await supabaseAdmin.from('care_circles').select('id').eq('id', data.circle_id).eq('deletion_pending', false).maybeSingle();
  if (!circle) return null;
  await supabaseAdmin.from('g2_devices').update({ last_seen_at: new Date().toISOString() }).eq('id', data.id);
  return { supabaseAdmin, circleId: data.circle_id, deviceId: data.id };
}

export async function sendTelegramMessage(chatId: number, text: string) {
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const {chatStarted}=await import('./telegram-permission.server');
  if(!await chatStarted(supabaseAdmin,chatId))return false;
  const connectionKey = process.env['TELEGRAM_API_KEY'];
  const lovableKey = process.env['LOVABLE_API_KEY'];
  if (!connectionKey || !lovableKey) return false;
  const response = await fetch('https://connector-gateway.lovable.dev/telegram/sendMessage', {
    method: 'POST',
    headers: { Authorization: `Bearer ${lovableKey}`, 'X-Connection-Api-Key': connectionKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!response.ok) { console.error(`Telegram request failed [${response.status}]`); return false; }
  const result: unknown = await response.json().catch(() => null);
  return Boolean(result && typeof result === 'object' && 'ok' in result && result.ok === true);
}

export async function telegramCall(method: 'sendVenue' | 'sendMessage', body: Record<string, unknown>) {
  const chatId=body['chat_id'];if(typeof chatId!=='number')return false;
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
  const {chatStarted}=await import('./telegram-permission.server');
  if(!await chatStarted(supabaseAdmin,chatId))return false;
  const connectionKey = process.env['TELEGRAM_API_KEY'];
  const lovableKey = process.env['LOVABLE_API_KEY'];
  if (!connectionKey || !lovableKey) return false;
  const response = await fetch(`https://connector-gateway.lovable.dev/telegram/${method}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${lovableKey}`, 'X-Connection-Api-Key': connectionKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) { console.error(`Telegram ${method} failed [${response.status}]`); return false; }
  const result: unknown = await response.json().catch(() => null);
  return Boolean(result && typeof result === 'object' && 'ok' in result && result.ok === true);
}
