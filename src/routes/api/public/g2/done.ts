import { createFileRoute } from '@tanstack/react-router';
import { deviceCircle, json, preflight } from '@/lib/g2-sync.server';
import { actionSchema } from '@/lib/care/schemas';

// Legacy callers must also identify the original occurrence and durable action.
const body = actionSchema.omit({ action: true });

export const Route = createFileRoute('/api/public/g2/done')({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const device = await deviceCircle(request);
        if (!device) return json({ ok: false, error: 'unpaired' }, 401);
        const parsed = body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ ok: false, error: 'Review today’s reminder in the updated companion before confirming.' }, 400);
        try {
          const { applyOccurrence } = await import('@/lib/care/service.server');
          return json(await applyOccurrence(device.supabaseAdmin, device.circleId, { ...parsed.data, action: 'done' }, 'Your Loved One'));
        } catch {
          return json({ ok: false, error: 'This reminder cannot be confirmed. Review today’s schedule.' }, 400);
        }
      },
    },
  },
});
