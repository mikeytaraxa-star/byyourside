import { Link } from '@tanstack/react-router';
import { Check, Clock, Glasses, HandHeart, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { familyStatus, validTimestamp, isConfirmedAction } from '@/lib/care/family-status';
import { useFamily } from './FamilyContext';

const actionLabels: Record<string, string> = {
  done: 'Reminder confirmed', 'routine-step': 'Routine step confirmed',
  help: 'Asked for help', later: 'Asked for more time', decline: 'Not today — not confirmed',
};

export function FamilyStatusPage() {
  const { data, demo, offline, pendingCount, lastLoadedAt, refresh, refreshing } = useFamily();
  const status = familyStatus(data);
  const timestamp = (value: string | null) => {
    const time = validTimestamp(value);
    return time === null ? 'Not recorded' : new Intl.DateTimeFormat(data.circle.preferences.language, {
      timeZone: data.circle.timezone, year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(time));
  };

  return <>
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-3xl font-semibold">Family status</h1><p className="mt-2 text-sm text-muted-foreground">{data.date} · {data.circle.timezone}</p></div>
      {!demo && <Button variant="outline" disabled={refreshing} onClick={() => void refresh()}><RefreshCw className={refreshing ? 'animate-spin motion-reduce:animate-none' : ''}/>{refreshing ? 'Refreshing…' : 'Refresh'}</Button>}
    </div>
    {demo && <p className="mb-5 text-sm font-semibold text-primary">Fictional family · sample actions only · no live device sync</p>}
    <section aria-label="Sync status" className="border-y border-border py-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div><div className="flex items-center gap-2 text-sm font-semibold"><Glasses className="h-4 w-4 text-primary"/>Last companion sync</div><p className="mt-3 break-words text-lg font-medium">{demo ? 'No live device connected' : status.lastDeviceSync ? timestamp(status.lastDeviceSync) : data.devices.length ? 'Paired · no sync recorded yet' : 'No paired companion'}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">A check-in from the paired companion, not proof the glasses are connected or being worn.</p></div>
        <div><div className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4 text-primary"/>Family information last updated</div><p className="mt-3 break-words text-lg font-medium">{demo ? 'Sample information' : timestamp(lastLoadedAt)}</p>{!demo && <p className="mt-2 text-xs text-muted-foreground">{offline ? 'Connection unavailable · showing saved information' : 'Last successful family refresh'}</p>}{pendingCount > 0 && <p role="status" className="mt-2 text-sm text-primary">{pendingCount} local {pendingCount === 1 ? 'choice waiting' : 'choices waiting'} to sync — not recorded by the family yet.</p>}</div>
      </div>
      {!demo && status.devices.length > 0 && <ul className="mt-5 divide-y divide-border border-t border-border">{status.devices.map((device, i) => <li key={device.id} className="flex flex-wrap justify-between gap-2 pt-3 pb-2 text-xs"><span>Paired companion {i + 1}</span><span className="text-muted-foreground">{validTimestamp(device.last_seen_at) === null ? 'No sync recorded' : timestamp(device.last_seen_at)}</span></li>)}</ul>}
    </section>
    <div className="grid gap-5 border-b border-border py-6 sm:grid-cols-3">
      {[{ label: 'Reminder confirmations', value: status.reminderConfirmations }, { label: 'Routine step confirmations', value: status.routineConfirmations }, { label: 'Help awaiting a family check-in', value: status.unansweredHelp }].map(item => <div key={item.label}><p className="text-3xl font-semibold">{item.value}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.label}</p></div>)}
    </div>
    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">A confirmation records a choice, not proof that medication was taken or a task was carried out. A family check-in is separate from a confirmation.</p>
    <section className="mt-8" aria-label="Recorded actions">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Recorded actions today</h2><Button asChild variant="link" className="px-0"><Link to="/family/checkins">Family check-ins <ArrowRight/></Link></Button></div>
      <p className="mt-2 text-xs text-muted-foreground">Today's actions from the latest 100 family events. Times are shown in {data.circle.timezone}; older events may not be included.</p>
      <div className="mt-4 divide-y divide-border">{status.events.map(event => {
        const confirmed = isConfirmedAction(event);
        const Icon = confirmed ? Check : event.kind === 'help' ? HandHeart : Clock;
        const reminder = data.reminders.find(item => item.id === event.reminder_id);
        const acknowledged = data.members.find(member => member.id === event.acknowledged_by)?.member_name ?? 'A family member';
        return <article key={event.id} className="flex items-start gap-3 py-5">
          <Icon className="mt-1 h-5 w-5 shrink-0 text-primary"/>
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-primary">{actionLabels[event.kind]}</p><h3 className="mt-2 break-words font-semibold">{reminder?.title ?? event.label}</h3><p className="mt-2 break-words text-xs text-muted-foreground">{event.actor_name} · {timestamp(event.created_at)}</p>{event.kind === 'help' && <p className="mt-2 text-xs text-muted-foreground">{event.acknowledged_by ? `${acknowledged} is checking in` : 'No family acknowledgement yet'}</p>}</div>
        </article>;
      })}</div>
      {!status.events.length && <p className="py-8 text-sm text-muted-foreground">No recorded actions for this day yet.{pendingCount > 0 ? ' Local choices will appear after a successful sync.' : ''}</p>}
    </section>
  </>;
}