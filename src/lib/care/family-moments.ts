import type { CareNote } from './types';

export const RECORDING_SECONDS = 60;
export const FAMILY_MEDIA_BYTES = 5 * 1024 * 1024;

export function dayMoments(notes: CareNote[], date: string): CareNote[] {
  return notes.filter(note => note.category === 'message' && note.recap_date === date && note.media_kind !== 'audio')
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at)).slice(0, 5);
}

export function familyMime(mime: string): string {
  return mime.split(';')[0]?.trim() ?? '';
}

export function validateFamilyFile(size: number, mime: string): void {
  if (size <= 0 || size > FAMILY_MEDIA_BYTES) throw new Error('Choose a file up to 5 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm'].includes(familyMime(mime))) {
    throw new Error('Choose a JPEG, PNG, WebP photo or an MP3, MP4, WAV or WebM recording.');
  }
}