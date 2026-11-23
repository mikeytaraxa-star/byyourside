import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { deviceCircle, json, preflight, sendTelegramMessage } from '@/lib/g2-sync.server';
import { localClock } from '@/lib/reminder-alerts';

const body = z.object({ reminderId: z.string().uuid() });

export const Route = createFileRoute('/api/public/g2/done')({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const device = await deviceCircle(request);
        if (!device) return json({ ok: false, error: 'unpaired' }, 401);
        const parsed = body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ ok: false, error: 'Invalid reminder' }, 400);
        const { supabaseAdmin, circleId } = device;
        const { data: circle } = await supabaseAdmin.from('care_circles').select('telegram_chat_id, timezone').eq('id', circleId).single();
        if (!circle) return json({ ok: false, error: 'unpaired' }, 401);
        const { date } = localClock(new Date(), circle.timezone);
        const { data: rows, error } = await supabaseAdmin.from('reminders')
          .update({ confirmed_on: date, confirmed_at: new Date().toISOString(), status: 'done' })
          .eq('id', parsed.data.reminderId).eq('circle_id', circleId).or(`confirmed_on.is.null,confirmed_on.neq.${date}`)
          .select('title, local_time');
        if (error) return json({ ok: false, error: 'Could not save' }, 500);
        const row = rows?.[0];
        if (row) await sendTelegramMessage(circle.telegram_chat_id, `✅ ${row.title} (${row.local_time.slice(0, 5)}) — done on the glasses.`).catch(() => false);
        return json({ ok: true });
      },
    },
  },
});
