import type { CareEvent, CareWorkspace } from './types';

export function validTimestamp(value: string | null): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

export function familyDate(value: string, timezone: string): string | null {
  const time = validTimestamp(value);
  if (time === null) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(time));
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function isConfirmedAction(event: Pick<CareEvent, 'kind'>): boolean {
  return event.kind === 'done' || event.kind === 'routine-step';
}

// Use durable events, never optimistic reminder state or family acknowledgements.
export function familyStatus(data: CareWorkspace) {
  const events = data.events.filter(event => familyDate(event.created_at, data.circle.timezone) === data.date)
    .sort((a, b) => (validTimestamp(b.created_at) ?? 0) - (validTimestamp(a.created_at) ?? 0));
  const devices = [...data.devices].sort((a, b) => (validTimestamp(b.last_seen_at) ?? 0) - (validTimestamp(a.last_seen_at) ?? 0));
  return {
    devices,
    lastDeviceSync: devices.find(device => validTimestamp(device.last_seen_at) !== null)?.last_seen_at ?? null,
    events: events.filter(event => ['done', 'routine-step', 'later', 'help', 'decline'].includes(event.kind)),
    reminderConfirmations: events.filter(event => event.kind === 'done').length,
    routineConfirmations: events.filter(event => event.kind === 'routine-step').length,
    unansweredHelp: events.filter(event => event.kind === 'help' && !event.acknowledged_by).length,
  };
}