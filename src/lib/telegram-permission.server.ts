import type { CareClient } from './care/auth.server';

/** Sending or storing a family command requires a verified chat /start opt-in. */
export async function chatStarted(client: CareClient, chatId: number): Promise<boolean> {
  const { data, error } = await client.from('telegram_updates').select('update_id').eq('chat_id', chatId).eq('text', '/start').limit(1).maybeSingle();
  return !error && Boolean(data);
}