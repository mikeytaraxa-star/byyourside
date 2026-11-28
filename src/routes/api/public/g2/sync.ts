import { createFileRoute } from '@tanstack/react-router';
import { deviceCircle, json, preflight } from '@/lib/g2-sync.server';
import { localClock } from '@/lib/reminder-alerts';
import { validLocation, venueBody } from '@/lib/findme';
import { telegramCall } from '@/lib/g2-sync.server';
import { z } from 'zod';

const syncBody = z.object({ location: z.unknown().optional() });

export const Route = createFileRoute('/api/public/g2/sync')({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const device = await deviceCircle(request);
        if (!device) return json({ ok: false, error: 'unpaired' }, 401);
        const { supabaseAdmin, circleId, deviceId } = device;
        const body = syncBody.safeParse(await request.json().catch(() => null));
        if (!body.success) return json({ error: 'Invalid synchronization request' }, 400);
        const loc = validLocation(body.data.location);
        const { data: circle } = await supabaseAdmin.from('care_circles').select('display_name, timezone, telegram_chat_id, findme_requested_at, preferences').eq('id', circleId).single();
        const { preferences, loadCare } = await import('@/lib/care/service.server');
        const prefs = preferences(circle?.preferences ?? {});
        if (loc && prefs.locationSharing) {
          const at = new Date().toISOString();
          await supabaseAdmin.from('g2_devices').update({ last_lat: loc.lat, last_lng: loc.lng, last_accuracy: loc.accuracy, last_location_at: at }).eq('id', deviceId);
          if (circle?.findme_requested_at && circle.telegram_chat_id) {
            // Claim the request first so two syncs at once cannot both send the location.
            const { data: claimed } = await supabaseAdmin.from('care_circles').update({ findme_requested_at: null })
              .eq('id', circleId).eq('findme_requested_at', circle.findme_requested_at).select('id');
            if (claimed?.length) {
              const sent = await telegramCall('sendVenue', venueBody(Number(circle.telegram_chat_id), { ...loc, at }, new Date()));
              if (!sent) await supabaseAdmin.from('care_circles').update({ findme_requested_at: circle.findme_requested_at }).eq('id', circleId).is('findme_requested_at', null);
            }
          }
        }
        const { date } = localClock(new Date(), circle?.timezone ?? 'UTC');
        const workspace = await loadCare(supabaseAdmin, circleId, {id: deviceId, role: 'viewer', member_name: 'Your Loved One'});
        return json({
          ok: true,
          name: circle?.display_name ?? 'Your Loved One',
          date,
          timezone: circle?.timezone ?? 'UTC',
          reminders: workspace.reminders.map(r => ({ id: r.id, time: r.effective_time, text: r.title, ...(r.detail ? { detail: r.detail } : {}), ...(r.critical ? { critical: true } : {}), status: r.state === 'done' ? 'done' : 'pending', careState: r.state, snoozeMinutes: r.snooze_minutes, version: r.version, leadMinutes: r.lead_minutes })),
          people: workspace.notes.filter(n => n.category === 'person').map(n => ({name:n.label,relation:'familiar person',note:n.answer})),
          notes: workspace.notes,
          routines: workspace.routines,
          preferences: prefs,
          findme: Boolean(circle?.findme_requested_at),
        });
      },
    },
  },
});
