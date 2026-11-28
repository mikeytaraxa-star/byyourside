export type CareRole = 'owner' | 'editor' | 'viewer';
import type { Language } from '@/lib/i18n';
export type CareAction = 'done' | 'later' | 'help' | 'decline' | 'repeat' | 'step';
export type CareState = 'pending' | 'done' | 'postponed' | 'help' | 'declined';
export type CarePreferences = {
  greeting: string; evening: string; quietFrom: string; quietTo: string;
  importantDuringQuiet: boolean; morningCheck: string; escalationMinutes: number;
  textSize: 'regular' | 'large'; displayPosition: 'left' | 'right'; promptSeconds: number;
  language: Language; breakUntil: string; locationSharing: boolean;
  notifyMode: 'instant' | 'digest';
};
export const defaultPreferences: CarePreferences = {
  greeting: 'Good morning. Take your time.', evening: 'Your day is winding down. Take your time.',
  quietFrom: '', quietTo: '', importantDuringQuiet: true, morningCheck: '', escalationMinutes: 30,
  textSize: 'regular', displayPosition: 'right', promptSeconds: 30, language: 'en', breakUntil: '', locationSharing: false,
  notifyMode: 'instant',
};
export type CareReminder = {
  id: string; local_time: string; title: string; detail: string | null; critical: boolean;
  snooze_minutes: number; date_override: string | null; state: CareState; effective_time: string;
  version: number; step: number; confirmed_on?: string | null; lead_minutes: number;
};
export type DeliveryOutcome = 'accepted' | 'failed';
export type CareRoutine = { id: string; title: string; local_time: string; steps: string[]; enabled: boolean; date_override: string | null; progress: number };
export type CareNote = { id: string; label: string; answer: string; category: 'person' | 'object' | 'reassurance' | 'message'; phone: string; media_path: string | null; media_kind: 'photo' | 'audio' | null; updated_at: string; recap_date?: string | null };
export type CareMember = { id: string; member_name: string; role: CareRole; direct_chat_id: number | null; notify_order: number; revoked_at: string | null };
export type CareEvent = { id: string; reminder_id: string | null; kind: string; label: string; actor_name: string; created_at: string; acknowledged_by: string | null; delivery: string; delivery_detail?: Record<string, string> | null };
export type CareHistory = { id: string; entity: string; entity_id: string; label: string; created_at: string; undone_at: string | null };
export type CareWorkspace = {
  circle: { id: string; display_name: string; timezone: string; summary_time: string; preferences: CarePreferences };
  member: { id: string; role: CareRole; member_name: string }; date: string; minute: number;
  reminders: CareReminder[]; routines: CareRoutine[]; notes: CareNote[]; members: CareMember[];
  events: CareEvent[]; history: CareHistory[];
  devices: { id: string; last_seen_at: string | null; created_at: string }[];
  capabilities: { cocoon: boolean; speech: false; battery: false; email: boolean };
};