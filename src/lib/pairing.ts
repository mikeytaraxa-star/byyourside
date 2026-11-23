// Browser-safe pairing helpers shared by the Telegram bot, the sync API and the glasses app.
export const PAIR_TTL_MINUTES = 15;
export const SYNC_INTERVAL_MS = 60_000;
export const DEFAULT_SYNC_ORIGIN = 'https://byside.here';

export function isPairCode(value: string) { return /^\d{6}$/.test(value.trim()); }
export function isPairCommand(text: string) { return /^\/pair(?:@\w+)?$/i.test(text.trim()); }
export function newPairCode(random: (n: number) => number = n => crypto.getRandomValues(new Uint32Array(1))[0]! % n) {
  return String(random(1_000_000)).padStart(6, '0');
}
export function pairCodeExpired(expiresAt: string, now = new Date()) { return new Date(expiresAt).getTime() <= now.getTime(); }
/** Installed Even Hub packages are not served from the website, so they call the published site. */
export function syncOrigin(location: { protocol: string; origin: string }) {
  return /^https?:$/.test(location.protocol) ? location.origin : DEFAULT_SYNC_ORIGIN;
}
export async function hashToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`g2-device:${token}`));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
