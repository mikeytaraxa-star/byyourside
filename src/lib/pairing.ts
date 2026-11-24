// Browser-safe pairing helpers shared by the Telegram bot, the sync API and the glasses app.
export const PAIR_TTL_MINUTES = 15;
export const SYNC_INTERVAL_MS = 60_000;
export const DEFAULT_SYNC_ORIGIN = 'https://byside.here';

/** 31 easy-to-read characters (no 0/O, 1/I/L). 10 characters ≈ 8×10^14 codes, so guessing a live code is impractical. */
export const PAIR_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const PAIR_CODE_LENGTH = 10;
/** Uppercases and removes spaces/dashes so "abcde-fghjk" matches "ABCDEFGHJK". */
export function normalizePairCode(value: string) { return value.toUpperCase().replace(/[^A-Z0-9]/g, ''); }
export function isPairCode(value: string) {
  const v = normalizePairCode(value);
  return v.length === PAIR_CODE_LENGTH && [...v].every(c => PAIR_ALPHABET.includes(c));
}
export function formatPairCode(code: string) { return `${code.slice(0, 5)}-${code.slice(5)}`; }
export function isPairCommand(text: string) { return /^\/pair(?:@\w+)?$/i.test(text.trim()); }
export function newPairCode(bytes: (n: number) => Uint8Array = n => crypto.getRandomValues(new Uint8Array(n))) {
  let code = '';
  // Rejection sampling keeps every character equally likely (248 = 31 × 8).
  while (code.length < PAIR_CODE_LENGTH) for (const b of bytes(16)) if (b < 248 && code.length < PAIR_CODE_LENGTH) code += PAIR_ALPHABET[b % 31];
  return code;
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
