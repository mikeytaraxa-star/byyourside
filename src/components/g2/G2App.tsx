import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Glasses, Mic, Plus, Power, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEvenHub } from '@/hooks/use-even-hub';
import { fmt, parseCommand, toMin, type Reminder } from '@/components/demo/engine';
import type { Gesture, GestureSource } from '@/components/demo/gestures';
import { latestUpdateQueue } from '@/lib/latest-update';
import { isPairCode, SYNC_INTERVAL_MS, syncOrigin } from '@/lib/pairing';
import { applyG2Gesture, dueSelection, emptySession, missedReminders, openingSelection, restoreSession, todayKey, MISSED_AFTER_MINUTES, type G2Session } from './session';

const STORAGE_KEY = 'byyourside.g2.schedule.v1';
const PAIR_KEY = 'byyourside.g2.pairing.v1';
export function G2App({ logoUrl = '/favicon.png' }: { logoUrl?: string }) {
  const [session, setSession] = useState<G2Session>(emptySession);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [notice, setNotice] = useState('');
  const [time, setTime] = useState('14:00');
  const [text, setText] = useState('');
  const [voiceConsent, setVoiceConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBytes, setAudioBytes] = useState(0);
  const [lastInput, setLastInput] = useState('No input yet');
  const [nativeLoaded, setNativeLoaded] = useState(false);
  const [pairToken, setPairToken] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState('');
  const [syncState, setSyncState] = useState('');
  const serverDone = useRef(new Set<string>());
  const gestureRef = useRef<(gesture: Gesture, source: GestureSource) => void>(() => {});
  const audioRevision = useRef(0);
  const audioTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingRef = useRef(false);
  const nativeWriter = useRef<ReturnType<typeof latestUpdateQueue<string>> | null>(null);
  const autoConnected = useRef(false);
  const minute = now ? now.getHours() * 60 + now.getMinutes() : 0;
  const hasClock = now !== null;
  const selected = session.reminders[session.selected];
  const missedCount = hasClock ? missedReminders(session, minute).length : 0;
  const selectedMissed = Boolean(selected && hasClock && selected.status === 'pending' && minute - toMin(selected.time) >= MISSED_AFTER_MINUTES);
  const display = useMemo(() => ({
    clock: hasClock ? fmt(minute) : '--:--',
    title: recording ? 'MICROPHONE' : selected ? `${selected.critical ? 'IMPORTANT · ' : ''}${selected.status === 'done' ? 'DONE' : selectedMissed ? (missedCount > 1 ? `EARLIER · 1 OF ${missedCount}` : 'EARLIER') : 'TODAY'} · ${selected.time}` : 'TODAY',
    body: recording ? 'Listening locally' : selected ? `${selected.text}${selected.detail ? `. ${selected.detail}` : ''}` : 'Nothing planned. Take your time.',
    footer: recording ? 'Release to stop' : selectedMissed ? 'Still to do? Tap = done' : selected?.status === 'done' ? 'All done. Thank you.' : selected && toMin(selected.time) <= minute ? 'Tap = done' : selected ? 'Not due yet' : '',
  }), [selected, hasClock, minute, recording, selectedMissed, missedCount]);
  const hub = useEvenHub({ display, onGesture: (gesture, source) => gestureRef.current(gesture, source), autoSensors: false });
  const connected = hub.status === 'connected';

  useEffect(() => {
    const date = new Date();
    setNow(date);
    const openMinute = date.getHours() * 60 + date.getMinutes();
    try { setSession(openingSelection(restoreSession(localStorage.getItem(STORAGE_KEY) ?? ''), openMinute)); } catch { setNotice('Phone storage unavailable.'); }
    try { setPairToken(localStorage.getItem(PAIR_KEY)); } catch { /* storage unavailable */ }
    setReady(true);
    let previousMinute = date.getHours() * 60 + date.getMinutes();
    const interval = setInterval(() => {
      const current = new Date();
      const nextMinute = current.getHours() * 60 + current.getMinutes();
      setNow(current);
      if (nextMinute !== previousMinute) {
        previousMinute = nextMinute;
        setSession(old => dueSelection(old.date === todayKey(current) ? old : restoreSession(JSON.stringify(old), todayKey(current)), nextMinute));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch { setNotice('Phone storage unavailable.'); }
    if (nativeLoaded && connected) nativeWriter.current?.push(JSON.stringify(session));
  }, [session, ready, nativeLoaded, connected]);

  useEffect(() => {
    if (!connected) { setNativeLoaded(false); return; }
    let active = true;
    nativeWriter.current = latestUpdateQueue<string>(async value => {
      if (!await hub.writeStorage(STORAGE_KEY, value)) throw new Error('Could not save on Even App');
    }, () => setNotice('Even App could not save this schedule.'));
    void hub.readStorage(STORAGE_KEY).then(raw => {
      if (!active) return;
      if (raw) { const d = new Date(); setSession(openingSelection(restoreSession(raw), d.getHours() * 60 + d.getMinutes())); }
      setNativeLoaded(true);
    }).catch(() => { if (active) setNotice('Even App storage could not be read. Reconnect before saving changes.'); });
    return () => { active = false; nativeWriter.current?.stop(); nativeWriter.current = null; };
  }, [connected, hub.readStorage, hub.writeStorage]);

  useEffect(() => {
    if (!ready || autoConnected.current) return;
    const host = window as Window & { flutter_inappwebview?: { callHandler?: unknown } };
    const start = () => {
      if (autoConnected.current) return;
      autoConnected.current = true;
      void hub.connect();
    };
    if (typeof host.flutter_inappwebview?.callHandler === 'function') start();
    window.addEventListener('flutterInAppWebViewPlatformReady', start);
    return () => window.removeEventListener('flutterInAppWebViewPlatformReady', start);
  }, [ready, hub.connect]);


  const api = useCallback(async (path: string, token: string | null, payload: unknown = {}) => {
    const response = await fetch(`${syncOrigin(window.location)}/api/public/g2/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => ({})) as Record<string, unknown>;
    return { status: response.status, data };
  }, []);
  const locationRef = useRef(hub.location);
  locationRef.current = hub.location;
  const unpair = useCallback(() => { try { localStorage.removeItem(PAIR_KEY); } catch { /* ignore */ } serverDone.current.clear(); setPairToken(null); setSyncState(''); }, []);

  useEffect(() => {
    if (!pairToken) return;
    let active = true;
    const pull = async () => {
      try {
        const where = locationRef.current;
        const { status, data } = await api('sync', pairToken, where ? { location: where } : {});
        if (!active) return;
        if (status === 401) { unpair(); setNotice('This phone was unpaired. Send /pair in Telegram for a new code.'); return; }
        if (!Array.isArray(data['reminders'])) throw new Error();
        const rows = data['reminders'] as Reminder[];
        serverDone.current = new Set(rows.filter(r => r.status === 'done').map(r => r.id));
        const d = new Date();
        setSession(old => {
          const keepDone = new Set(old.reminders.filter(r => r.status === 'done').map(r => r.id));
          const reminders = rows.map(r => keepDone.has(r.id) ? { ...r, status: 'done' as const } : r);
          const same = old.reminders.length === reminders.length && old.reminders.every((r, i) => r.id === reminders[i]?.id);
          const next = { date: todayKey(d), sample: false, reminders, selected: same ? old.selected : 0 };
          return same ? next : openingSelection(next, d.getHours() * 60 + d.getMinutes());
        });
        setSyncState(`Synced with Telegram · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } catch { if (active) setSyncState('Offline · showing saved reminders'); }
    };
    void pull();
    const id = setInterval(() => void pull(), SYNC_INTERVAL_MS);
    return () => { active = false; clearInterval(id); };
  }, [pairToken, api, unpair]);

  useEffect(() => {
    if (!pairToken) return;
    for (const row of session.reminders) {
      if (row.status !== 'done' || serverDone.current.has(row.id)) continue;
      serverDone.current.add(row.id);
      void api('done', pairToken, { reminderId: row.id }).then(({ status }) => { if (status !== 200) serverDone.current.delete(row.id); }).catch(() => serverDone.current.delete(row.id));
    }
  }, [session, pairToken, api]);

  const stopRecording = useCallback(() => {
    audioRevision.current += 1;
    if (audioTimer.current) clearTimeout(audioTimer.current);
    audioTimer.current = null;
    recordingRef.current = false;
    setRecording(false);
    void hub.stopAudio().catch(() => setNotice('The microphone could not stop. Disconnect G2.'));
  }, [hub.stopAudio]);

  const beginRecording = useCallback(async () => {
    if (!connected) { setNotice('Connect G2 in Even App first.'); return; }
    if (!voiceConsent) { setNotice('Microphone permission is off.'); return; }
    stopRecording();
    const revision = ++audioRevision.current;
    setAudioBytes(0);
    try {
      await hub.startAudio(chunk => { if (revision === audioRevision.current) setAudioBytes(old => old + chunk.byteLength); });
      if (revision !== audioRevision.current) return;
      recordingRef.current = true;
      setRecording(true);
      setNotice('Local audio only. Speech recognition is not connected.');
      audioTimer.current = setTimeout(stopRecording, 12000);
    } catch (error) { if (revision === audioRevision.current) setNotice(error instanceof Error ? error.message : 'Microphone unavailable.'); }
  }, [connected, voiceConsent, stopRecording, hub.startAudio, hub.stopAudio]);

  gestureRef.current = (gesture, source) => {
    setLastInput(`${source} · ${gesture}`);
    if (gesture === 'hold') { void beginRecording(); return; }
    if (gesture === 'release') { stopRecording(); return; }
    if (gesture === 'menu-ask') {
      if (recordingRef.current) stopRecording(); else void beginRecording();
      return;
    }
    stopRecording();
    setSession(old => applyG2Gesture(old, gesture, minute));
  };
  useEffect(() => { if (!connected) stopRecording(); }, [connected, stopRecording]);
  useEffect(() => () => { audioRevision.current += 1; if (audioTimer.current) clearTimeout(audioTimer.current); }, []);
  useEffect(() => {
    const suspend = () => { stopRecording(); hub.stop(); };
    const visibility = () => { if (document.visibilityState === 'hidden') suspend(); };
    window.addEventListener('pagehide', suspend);
    document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('pagehide', suspend); document.removeEventListener('visibilitychange', visibility); };
  }, [stopRecording, hub.stop]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 font-sans text-foreground sm:px-8">
      <header className="flex items-center gap-4 border-b border-border pb-6">
        <img src={logoUrl} alt="ByYourSide" className="h-14 w-14 object-contain" />
        <div className="min-w-0"><h1 className="text-2xl font-bold">ByYourSide</h1><p className="text-sm text-muted-foreground">Even G2 · Your Loved One</p></div>
      </header>
      <section className="border-b border-border py-6" aria-label="Glasses connection">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Glasses className="h-5 w-5 text-primary" /><h2 className="font-semibold">{connected ? 'G2 connected' : hub.status === 'connecting' ? 'Connecting G2…' : 'G2 not connected'}</h2></div>
          <Button disabled={hub.status === 'connecting'} onClick={() => { if (connected) { stopRecording(); hub.stop(); } else void hub.connect(); }} variant={connected ? 'outline' : 'default'}><Power />{connected ? 'Disconnect' : 'Connect G2'}</Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground" role="status">{hub.message}</p>
        <p className="mt-2 text-xs text-muted-foreground">{connected ? lastInput : 'Even App 2.2.10+ required · No simulated hardware'}</p>
      </section>
      <section className="border-b border-border py-6" aria-label="Telegram pairing">
        <h2 className="font-semibold">Family Telegram</h2>
        {pairToken ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground" role="status">{syncState || 'Paired · syncing…'}</p><Button variant="outline" onClick={unpair}>Unpair</Button></div>
        ) : (
          <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={async event => {
            event.preventDefault();
            if (!isPairCode(pairCode)) { setNotice('Enter the 10-character code from Telegram.'); return; }
            try {
              const { status, data } = await api('pair', null, { code: pairCode.trim() });
              if (status !== 200 || typeof data['token'] !== 'string') { setNotice(typeof data['error'] === 'string' ? data['error'] : 'Pairing failed.'); return; }
              try { localStorage.setItem(PAIR_KEY, data['token']); } catch { /* keep for this session */ }
              setPairCode(''); setPairToken(data['token']); setNotice('Paired with the family. Reminders now come from Telegram.');
            } catch { setNotice('No internet connection. Try again.'); }
          }}>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">Send /pair to @bysappbot, then enter the code<input className="h-10 w-48 rounded-md border border-input bg-background px-3 text-lg tracking-widest text-foreground" aria-label="Pairing code" autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={11} value={pairCode} onChange={event => setPairCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} placeholder="ABCDE-FGHJK" /></label>
            <Button type="submit" disabled={!isPairCode(pairCode)}>Pair</Button>
          </form>
        )}
      </section>
      <section className="border-b border-border py-6" aria-label="Current reminder">
        <div className="mb-4 flex items-center justify-between gap-4"><h2 className="font-semibold">Today</h2><time className="text-lg tabular-nums">{display.clock}</time></div>
        {session.sample && <p className="mb-3 text-xs font-semibold text-primary">SAMPLE SCHEDULE</p>}
        <p className="text-xs text-muted-foreground">{display.title}</p><p className="mt-2 break-words text-2xl leading-snug">{display.body}</p><p className="mt-3 text-sm text-primary">{display.footer}</p>
        <div className="mt-5 flex items-center gap-2">
          <Button variant="outline" size="icon" title="Previous reminder" aria-label="Previous reminder" disabled={!session.reminders.length || !ready} onClick={() => { stopRecording(); setSession(old => applyG2Gesture(old, 'swipe-down', minute)); }}><ArrowUp /></Button>
          <Button variant="outline" size="icon" title="Next reminder" aria-label="Next reminder" disabled={!session.reminders.length || !ready} onClick={() => { stopRecording(); setSession(old => applyG2Gesture(old, 'swipe-up', minute)); }}><ArrowDown /></Button>
          <Button disabled={!selected || selected.status !== 'pending' || toMin(selected.time) > minute || !ready} onClick={() => { stopRecording(); setSession(old => applyG2Gesture(old, 'tap', minute)); }}><Check />Done</Button>
        </div>
      </section>
      <section className="border-b border-border py-6" aria-label="Saved reminders">
        <h2 className="mb-4 font-semibold">{session.sample ? 'Sample reminders' : 'Your reminders'} <span className="text-muted-foreground">{session.reminders.length}/50</span></h2>
        <ul className="divide-y divide-border">
          {session.reminders.map((row, index) => <li key={row.id} className="flex items-center gap-3 py-3"><Button variant="ghost" className="h-auto min-w-0 flex-1 justify-start whitespace-normal text-left" onClick={() => { stopRecording(); setSession(old => ({ ...old, selected: index })); }}><span className="shrink-0 text-muted-foreground">{row.time}</span><span className="min-w-0 break-words">{row.text}</span>{row.status === 'done' && <Check className="shrink-0 text-primary" />}</Button><Button variant="ghost" size="icon" aria-label={`Delete ${row.text}`} title="Delete reminder" onClick={() => { stopRecording(); setSession(old => ({ ...old, selected: 0, reminders: old.reminders.filter(item => item.id !== row.id) })); }}><Trash2 /></Button></li>)}
        </ul>
        <form className="mt-4 flex flex-wrap gap-2" onSubmit={event => {
          event.preventDefault();
          const command = parseCommand(`/remind ${time} ${text}`);
          if (command.kind !== 'remind') { setNotice(command.reply); return; }
          if (session.reminders.length >= 50) { setNotice('This schedule is full. Remove a reminder first.'); return; }
          stopRecording();
          const added: Reminder = { ...command.reminder, id: crypto.randomUUID(), status: 'pending' };
          setSession(old => ({ ...old, sample: false, reminders: [...(old.sample ? [] : old.reminders), added].sort((a, b) => toMin(a.time) - toMin(b.time)), selected: 0 }));
          setText(''); setNotice('Reminder saved on this device.');
        }}>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">Time<input className="h-10 rounded-md border border-input bg-background px-2 text-sm text-foreground" aria-label="Reminder time" type="time" value={time} onChange={event => setTime(event.target.value)} required /></label>
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted-foreground">Reminder<input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" aria-label="Reminder text" value={text} onChange={event => setText(event.target.value)} maxLength={300} required /></label>
          <Button type="submit" aria-label="Add reminder" title="Add reminder" size="icon" className="mt-5 h-10 w-10" disabled={!ready || (connected && !nativeLoaded)}><Plus /></Button>
        </form>
        {!session.reminders.length && <Button variant="link" className="mt-3 px-0" disabled={!ready} onClick={() => setSession({ date: todayKey(), sample: true, selected: 0, reminders: [{ id: 'sample-water', time: fmt(minute), text: 'Have a glass of water', status: 'pending' }, { id: 'sample-walk', time: fmt((minute + 30) % 1440), text: 'A gentle walk with Anna', status: 'pending' }] })}>Load sample schedule</Button>}
      </section>
      <section className="space-y-4 border-b border-border py-6" aria-label="Privacy and sensors">
        <label className="flex items-center justify-between gap-4 text-sm"><span>Phone location &amp; head motion<span className="block text-xs text-muted-foreground">When paired, family can see it with /findme</span></span><input type="checkbox" aria-label="Enable location and motion" className="h-5 w-5 accent-primary" checked={hub.sensorsActive} disabled={!connected} onChange={event => void hub.setSensors(event.target.checked).catch(() => setNotice('Sensor permission is unavailable.'))} /></label>
        {hub.location && <p className="text-xs text-muted-foreground">Phone GPS · {hub.location.latitude.toFixed(4)}, {hub.location.longitude.toFixed(4)}{hub.location.accuracy ? ` · ±${Math.round(hub.location.accuracy)} m` : ''}</p>}
        {hub.motion && <p className="text-xs text-muted-foreground">Head motion · {hub.motion.x.toFixed(2)} / {hub.motion.y.toFixed(2)} / {hub.motion.z.toFixed(2)}</p>}
        <label className="flex items-center justify-between gap-4 text-sm"><span>Allow local G2 microphone</span><input type="checkbox" aria-label="Allow local G2 microphone" className="h-5 w-5 accent-primary" checked={voiceConsent} onChange={event => { setVoiceConsent(event.target.checked); if (!event.target.checked) stopRecording(); }} /></label>
        <div className="flex flex-wrap items-center gap-3"><Button variant="outline" disabled={!connected || !voiceConsent} onClick={() => { if (recording) stopRecording(); else void beginRecording(); }}><Mic />{recording ? 'Stop microphone' : 'Test microphone'}</Button><span className="text-xs text-muted-foreground">{audioBytes > 0 ? `${audioBytes.toLocaleString()} bytes received · discarded` : 'Audio stays local · No speech recognition'}</span></div>
      </section>
      {notice && <p role="status" className="mt-4 text-sm text-primary">{notice}</p>}
      <footer className="pt-6 text-xs leading-relaxed text-muted-foreground"><p>Telegram sync: {pairToken ? 'paired' : 'not paired'} · Cocoon AI: not configured</p><p className="mt-2">Not a medical device or emergency service.</p></footer>
    </main>
  );
}
