/** Pure helpers for /findme: Telegram venue card built from the glasses' last shared location. */
export const FINDME_FRESH_MINUTES = 10;

export function isFindMeCommand(text: string) {
  return /^\/findme(?:@\w+)?\s*$/i.test(text.trim());
}

export type SharedLocation = { lat: number; lng: number; accuracy: number | null; at: string };

export function validLocation(value: unknown): Omit<SharedLocation, 'at'> | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const lat = Number(v['latitude']), lng = Number(v['longitude']);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const acc = Number(v['accuracy']);
  return { lat, lng, accuracy: Number.isFinite(acc) && acc >= 0 ? acc : null };
}

export function ageLabel(at: string, now: Date) {
  const min = Math.max(0, Math.round((now.getTime() - new Date(at).getTime()) / 60_000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

export function isFresh(at: string, now: Date) {
  return now.getTime() - new Date(at).getTime() <= FINDME_FRESH_MINUTES * 60_000;
}

/** Body for Telegram sendVenue — renders as a map card with title and address line. */
export function venueBody(chatId: number, loc: SharedLocation, now: Date) {
  const acc = loc.accuracy != null ? ` · ±${Math.round(loc.accuracy)} m` : '';
  return {
    chat_id: chatId,
    latitude: loc.lat,
    longitude: loc.lng,
    title: '📍 Your Loved One is here',
    address: `Glasses location · ${ageLabel(loc.at, now)}${acc}`,
  };
}

export function mapsLink(loc: Pick<SharedLocation, 'lat' | 'lng'>) {
  return `https://maps.google.com/?q=${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`;
}
