import { describe, expect, it, vi } from 'vitest';
import { careOperation } from './service.server';
import type { FamilyActor } from './auth.server';
import type { CareRole } from './types';
function fixture(role: CareRole = 'owner', noteCircle = 'family-a') {
  const sign = vi.fn(async () => ({ data: { signedUrl: 'https://example.test/private-short-lived' }, error: null }));
  const upload = vi.fn(async () => ({ error: null }));
  const filters: Record<string, unknown> = {};
  const query = {
    select: vi.fn(() => query), eq: vi.fn((key: string, value: unknown) => { filters[key] = value; return query; }),
    single: vi.fn(async () => ({ data: filters['circle_id'] === noteCircle ? { id: 'note', media_path: `${noteCircle}/note/audio` } : null, error: null })),
  };
  const actor = { circleId: 'family-a', member: { id: 'member', role, member_name: 'Anna' }, client: { from: () => query, storage: { from: () => ({ createSignedUrl: sign, upload }) } } } as unknown as FamilyActor;
  return { actor, query, sign, upload };
}
describe('private family media', () => {
  it('issues only a short-lived viewing link scoped to the resolved family', async () => {
    const f = fixture('viewer');
    expect(await careOperation(f.actor, { op: 'media-read', noteId: '11111111-1111-4111-8111-111111111111' })).toMatchObject({ url: 'https://example.test/private-short-lived' });
    expect(f.query.eq).toHaveBeenCalledWith('circle_id', 'family-a');
    expect(f.sign).toHaveBeenCalledExactlyOnceWith('family-a/note/audio', 120);
  });
  it('cannot open another family’s media', async () => {
    const f = fixture('owner', 'family-b');
    await expect(careOperation(f.actor, { op: 'media-read', noteId: '11111111-1111-4111-8111-111111111111' })).rejects.toThrow('Note unavailable');
    expect(f.sign).not.toHaveBeenCalled();
  });
  it('does not let a viewer replace family recordings', async () => {
    const f = fixture('viewer');
    await expect(careOperation(f.actor, { op: 'media', noteId: '11111111-1111-4111-8111-111111111111', kind: 'audio', mime: 'audio/webm', data: 'YQ==' })).rejects.toThrow('Editor permission required');
    expect(f.upload).not.toHaveBeenCalled();
  });
});