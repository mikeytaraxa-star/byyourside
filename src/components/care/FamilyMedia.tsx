import { useState } from 'react';
import { Mic, Square, Trash2, Save, Play, Image as ImageIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useFamily } from './FamilyContext';
import { useFamilyRecording } from '@/hooks/use-family-recording';
import { dayMoments, familyMime, validateFamilyFile } from '@/lib/care/family-moments';
import type { CareNote } from '@/lib/care/types';

async function encoded(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result.split(',')[1] ?? '') : reject(new Error('Could not read this file.'));
    reader.readAsDataURL(blob);
  });
}

export function FamilyMediaEditor({ note }: { note: CareNote }) {
  const { operate, busy } = useFamily();
  const recording = useFamilyRecording();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const save = async (blob: Blob) => {
    setError(''); setSaved(false);
    try {
      validateFamilyFile(blob.size, blob.type);
      await operate({ op: 'media', noteId: note.id, kind: blob.type.startsWith('image/') ? 'photo' : 'audio', mime: familyMime(blob.type), data: await encoded(blob) });
      recording.discard(); setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save this recording.'); }
  };
  return <div className="mt-5 space-y-3 border-t border-border pt-4">
    <label className="flex items-start gap-3 text-sm"><Checkbox checked={recording.consent} disabled={recording.status !== 'idle'} onCheckedChange={value => recording.setConsent(value === true)} /><span>I have permission to share this photo or voice recording with our family and companion phone.</span></label>
    <div className="flex flex-wrap gap-2">
      {recording.status === 'recording' ? <Button variant="outline" onClick={recording.stop}><Square />Stop · {recording.seconds}s / 60s</Button> : recording.status !== 'preview' && <Button variant="outline" disabled={!recording.consent || busy || recording.status === 'opening'} onClick={() => void recording.start()}><Mic />{recording.status === 'opening' ? 'Opening microphone…' : 'Record a familiar voice'}</Button>}
      {recording.status !== 'idle' && <Button variant="ghost" size="icon" title="Discard recording" aria-label="Discard recording" onClick={recording.discard}><Trash2 /></Button>}
    </div>
    {recording.url && <><audio controls src={recording.url} className="w-full" aria-label="Preview family recording" /><Button disabled={busy} onClick={() => { if (recording.blob) void save(recording.blob); }}><Save />Save approved recording</Button></>}
    <label className="block space-y-2 text-sm"><span className="text-muted-foreground">Or upload a photo or recording · up to 5 MB</span><Input type="file" disabled={!recording.consent || busy || recording.status !== 'idle'} accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/mp4,audio/wav,audio/webm" onChange={e => { const file = e.target.files?.[0]; if (file) void save(file); e.target.value = ''; }} /></label>
    {note.media_path && <Button variant="ghost" disabled={busy} onClick={async () => { try { await operate({ op: 'media-remove', noteId: note.id }); setSaved(false); } catch (e) { setError(e instanceof Error ? e.message : 'Could not remove media.'); } }}><Trash2 />Remove media</Button>}
    {(error || recording.error) && <p role="alert" className="text-sm text-destructive">{error || recording.error}</p>}
    {saved && <p role="status" className="text-sm text-primary">Saved privately for your family.</p>}
  </div>;
}

export function FamilyMediaView({ note }: { note: CareNote }) {
  const { operate } = useFamily();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (!note.media_path) return null;
  const open = async () => {
    setLoading(true); setError('');
    try { const result = await operate({ op: 'media-read', noteId: note.id }); if (typeof result['url'] !== 'string') throw new Error('This family media is no longer available.'); setUrl(result['url']); }
    catch { setError('Connect to open this family media, or try again.'); }
    finally { setLoading(false); }
  };
  return <div className="mt-5 space-y-3">
    {!url ? <Button variant="outline" disabled={loading} onClick={() => void open()}>{note.media_kind === 'audio' ? <Play /> : <ImageIcon />}{loading ? 'Opening…' : note.media_kind === 'audio' ? `Listen to ${note.label}` : 'Open family photo'}</Button> : note.media_kind === 'audio' ? <><audio controls src={url} className="w-full" aria-label={`Family recording: ${note.label}`} onError={() => { setUrl(''); setError('The recording link expired or could not play. Tap to try again.'); }} /><p className="text-xs text-muted-foreground">On this phone</p></> : <img src={url} alt={note.answer || note.label} className="max-h-96 w-full rounded-lg object-contain" onError={() => { setUrl(''); setError('The photo link expired. Tap to try again.'); }} />}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}

export function GentleRecap() {
  const { data } = useFamily();
  const moments = dayMoments(data.notes, data.date);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const moment = moments[Math.min(index, moments.length - 1)];
  if (!moment) return null;
  return <section className="mt-8 border-t border-border pt-7" aria-label="Gentle day recap">
    <h2 className="text-lg font-semibold">A few moments from today</h2>
    {!open ? <Button className="mt-4" variant="outline" onClick={() => setOpen(true)}><ImageIcon />Look back at today</Button> : <div className="mt-5">
      <p className="text-xs text-muted-foreground">{Math.min(index + 1, moments.length)} of {moments.length}</p>
      <h3 className="mt-3 text-2xl font-semibold">{moment.label}</h3>
      {moment.answer && <p className="mt-3 text-xl leading-relaxed">{moment.answer}</p>}
      <FamilyMediaView key={`${moment.id}:${moment.media_path}`} note={moment} />
      <div className="mt-5 flex flex-wrap gap-3"><Button variant="outline" size="icon" title="Previous moment" aria-label="Previous moment" disabled={index === 0} onClick={() => setIndex(i => Math.max(0, i - 1))}><ArrowLeft /></Button><Button variant="outline" disabled={index >= moments.length - 1} onClick={() => setIndex(i => Math.min(moments.length - 1, i + 1))}>Next moment <ArrowRight /></Button><Button variant="ghost" onClick={() => { setOpen(false); setIndex(0); }}>All done</Button></div>
    </div>}
  </section>;
}