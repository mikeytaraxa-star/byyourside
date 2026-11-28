import type { CareClient } from './auth.server';

/** Cleanup can be retried by the scheduled job after credentials are revoked. */
export async function eraseFamilyData(client: CareClient, circleId: string) {
  const { data: circle, error: lookupError } = await client.from('care_circles').select('telegram_chat_id').eq('id', circleId).single();
  if (lookupError || !circle) throw new Error('Family cleanup unavailable');
  const { error: lockError } = await client.rpc('care_begin_erase', { p_circle: circleId });
  if (lockError) throw new Error('Could not revoke family access');
  const bucket = client.storage.from('care-family-media');
  async function removeFolder(prefix: string): Promise<void> {
    // Always restart at zero because each batch is removed before the next read.
    for (;;) {
      const { data, error } = await bucket.list(prefix, { limit: 100, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw new Error('Private media cleanup will be retried');
      if (!data?.length) return;
      const files: string[] = [];
      for (const item of data) {
        const path = `${prefix}/${item.name}`;
        if (item.id) files.push(path); else await removeFolder(path);
      }
      if (files.length) {
        const { error: removalError } = await bucket.remove(files);
        if (removalError) throw new Error('Private media cleanup will be retried');
      }
      // Virtual folders disappear after recursive removal; repeat for >100 folders.
    }
  }
  // Enumerate the whole family prefix, including deleted notes and failed uploads.
  await removeFolder(circleId);
  for (const table of ['care_occurrences', 'care_events', 'care_history', 'care_routines', 'care_notes', 'people', 'reminders', 'care_members'] as const) {
    const { error } = await client.from(table).delete().eq('circle_id', circleId);
    if (error) throw new Error('Family cleanup will be retried');
  }
  const { error: updatesError } = await client.from('telegram_updates').delete().eq('chat_id', circle.telegram_chat_id);
  if (updatesError) throw new Error('Family cleanup will be retried');
  const { error: circleError } = await client.from('care_circles').delete().eq('id', circleId).eq('deletion_pending', true);
  if (circleError) throw new Error('Family cleanup will be retried');
}