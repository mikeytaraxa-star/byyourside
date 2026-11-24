import { createFileRoute } from '@tanstack/react-router';
import { deviceCircle, json, preflight } from '@/lib/g2-sync.server';
import { localClock } from '@/lib/reminder-alerts';
import { validLocation, venueBody } from '@/lib/findme';
import { telegramCall } from '@/lib/g2-sync.server';

export const Route = createFileRoute('/api/public/g2/sync')({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const device = await deviceCircle(request);
        if (!device) return json({ ok: false, error: 'unpaired' }, 401);
        const { supabaseAdmin, circleId, deviceId } = device;
        const body = await request.json().catch(() => ({})) as Record<string, unknown>;
        const loc = validLocation(body['location']);
        const { data: circle } = await supabaseAdmin.from('care_circles').select('display_name, timezone, telegram_chat_id, findme_requested_at').eq('id', circleId).single();
        if (loc) {
          const at = new Date().toISOString();
          await supabaseAdmin.from('g2_devices').update({ last_lat: loc.lat, last_lng: loc.lng, last_accuracy: loc.accuracy, last_location_at: at }).eq('id', deviceId);
          if (circle?.findme_requested_at && circle.telegram_chat_id) {
            const sent = await telegramCall('sendVenue', venueBody(Number(circle.telegram_chat_id), { ...loc, at }, new Date()));
            if (sent) await supabaseAdmin.from('care_circles').update({ findme_requested_at: null }).eq('id', circleId);
          }
        }
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
          findme: Boolean(circle?.findme_requested_at),
        });
      },
    },
  },
});
