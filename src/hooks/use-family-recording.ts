import { useEffect, useRef, useState } from 'react';
import { familyMime, RECORDING_SECONDS, validateFamilyFile } from '@/lib/care/family-moments';

// Family-authored recordings are separate from the no-upload voice-question demo.
export function useFamilyRecording() {
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'opening' | 'recording' | 'preview'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const preview = useRef('');
  const generation = useRef(0);
  const cleanup = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  };
  const clearPreview = () => {
    if (preview.current) URL.revokeObjectURL(preview.current);
    preview.current = '';
  };
  const discard = () => {
    generation.current++;
    if (recorder.current?.state === 'recording') recorder.current.stop();
    recorder.current = null;
    cleanup(); clearPreview(); setBlob(null); setUrl(''); setStatus('idle'); setSeconds(0);
  };
  useEffect(() => () => {
    generation.current++;
    if (recorder.current?.state === 'recording') recorder.current.stop();
    cleanup(); clearPreview();
  }, []);
  const stop = () => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    cleanup();
  };
  const start = async () => {
    if (!consent || status !== 'idle') return;
    setError(''); setStatus('opening');
    const ticket = ++generation.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('Recording is unavailable on this phone. You can upload a recording instead.');
      const opened = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (ticket !== generation.current) { opened.getTracks().forEach(track => track.stop()); return; }
      stream.current = opened;
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(value => MediaRecorder.isTypeSupported(value));
      if (!mime) throw new Error('This phone cannot record a supported format. Upload a recording instead.');
      const capture = new MediaRecorder(opened, { mimeType: mime });
      recorder.current = capture;
      const chunks: Blob[] = [];
      capture.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      capture.onstop = () => {
        if (ticket !== generation.current) return;
        cleanup();
        const recording = new Blob(chunks, { type: familyMime(capture.mimeType) });
        try {
          validateFamilyFile(recording.size, recording.type);
          clearPreview(); preview.current = URL.createObjectURL(recording);
          setBlob(recording); setUrl(preview.current); setStatus('preview');
        } catch (e) { setError(e instanceof Error ? e.message : 'Recording failed.'); setStatus('idle'); }
      };
      capture.onerror = () => { discard(); setError('Recording failed. Please try again.'); };
      capture.start(); setSeconds(0); setStatus('recording');
      let elapsed = 0;
      timer.current = setInterval(() => { elapsed++; setSeconds(elapsed); if (elapsed >= RECORDING_SECONDS) stop(); }, 1000);
    } catch (e) {
      cleanup();
      if (ticket === generation.current) { setError(e instanceof Error ? e.message : 'Microphone unavailable.'); setStatus('idle'); }
    }
  };
  return { consent, setConsent, status, seconds, blob, url, error, start, stop, discard };
}