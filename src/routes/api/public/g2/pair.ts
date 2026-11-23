import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { hashToken, isPairCode, pairCodeExpired } from '@/lib/pairing';
import { json, preflight } from '@/lib/g2-sync.server';

const body = z.object({ code: z.string().max(12) });

export const Route = createFileRoute('/api/public/g2/pair')({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const parsed = body.safeParse(await request.json().catch(() => null));
        const code = parsed.success ? parsed.data.code.trim() : '';
        if (!isPairCode(code)) return json({ ok: false, error: 'Enter the 6-digit code from Telegram.' }, 400);
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { data: row } = await supabaseAdmin.from('pairing_codes').select('code, circle_id, expires_at, used_at').eq('code', code).maybeSingle();
        if (!row || row.used_at || pairCodeExpired(row.expires_at)) return json({ ok: false, error: 'That code is wrong or expired. Send /pair again.' }, 400);
        const { data: claimed } = await supabaseAdmin.from('pairing_codes').update({ used_at: new Date().toISOString() }).eq('code', code).is('used_at', null).select('code');
        if (!claimed?.length) return json({ ok: false, error: 'That code was already used.' }, 400);
        const bytes = crypto.getRandomValues(new Uint8Array(32));
        const token = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
        const { error } = await supabaseAdmin.from('g2_devices').insert({ circle_id: row.circle_id, token_hash: await hashToken(token) });
        if (error) return json({ ok: false, error: 'Pairing failed. Try again.' }, 500);
        const { data: circle } = await supabaseAdmin.from('care_circles').select('telegram_chat_id').eq('id', row.circle_id).single();
        if (circle) {
          const { sendTelegramMessage } = await import('@/lib/g2-sync.server');
          await sendTelegramMessage(circle.telegram_chat_id, '👓 Glasses paired. Reminders now sync to the glasses while the app is open.').catch(() => false);
        }
        return json({ ok: true, token });
      },
    },
  },
});
