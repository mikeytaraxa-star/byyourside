import type { SupabaseClient } from '@supabase/supabase-js';
/** Download private media inside an authorized request and return it inline, so no reusable bearer link outlives the caller's access. */
export async function inlineFamilyMedia(client: SupabaseClient<any, any, any>, path: string): Promise<string | null> {
  const { data, error } = await client.storage.from('care-family-media').download(path);
  if (error || !data) return null;
  const bytes = new Uint8Array(await data.arrayBuffer());
  let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const mime = /^[a-z]+\/[a-z0-9.+-]+$/i.test(data.type) ? data.type : 'application/octet-stream';
  return `data:${mime};base64,${btoa(bin)}`;
}
