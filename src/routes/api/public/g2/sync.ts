import { createFileRoute } from '@tanstack/react-router';
import { deviceCircle, json, preflight } from '@/lib/g2-sync.server';
import { localClock } from '@/lib/reminder-alerts';

export const Route = createFileRoute('/api/public/g2/sync')({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const device = await deviceCircle(request);
        if (!device) return json({ ok: false, error: 'unpaired' }, 401);
        const { supabaseAdmin, circleId } = device;
        const { data: circle } = await supabaseAdmin.from('care_circles').select('display_name, timezone').eq('id', circleId).single();
        const { date } = localClock(new Date(), circle?.timezone ?? 'UTC');
        const [{ data: reminders }, { data: people }] = await Promise.all([
          supabaseAdmin.from('reminders').select('id, local_time, title, detail, confirmed_on').eq('circle_id', circleId).order('local_time').limit(50),
          supabaseAdmin.from('people').select('name, relation, note').eq('circle_id', circleId).limit(50),
        ]);
        return json({
          ok: true,
          name: circle?.display_name ?? 'Your Loved One',
          reminders: (reminders ?? []).map(r => ({ id: r.id, time: r.local_time.slice(0, 5), text: r.title, ...(r.detail ? { detail: r.detail } : {}), status: r.confirmed_on === date ? 'done' : 'pending' })),
          people: people ?? [],
        });
      },
    },
  },
});
