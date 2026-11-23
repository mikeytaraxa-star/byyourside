import { useCallback, useEffect, useRef, useState } from "react";
import type { EvenHubController } from "./use-even-hub";
import { MAX_PCM_BYTES, MAX_RECORDING_MS, pcmToWav } from "@/lib/voice-audio";

export type VoiceStatus = "idle" | "requesting" | "listening" | "previewing" | "error";
export function useVoiceQuestion(g2: EvenHubController, onTranscript: (text: string) => void) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [demoQuestion, setDemoQuestion] = useState("What's next?");
  const selectedQuestion = useRef(demoQuestion);
  selectedQuestion.current = demoQuestion;
  const state = useRef<VoiceStatus>("idle");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const pcm = useRef<Uint8Array[]>([]);
  const pcmBytes = useRef(0);
  const native = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const callback = useRef(onTranscript);
  callback.current = onTranscript;
  const update = useCallback((next: VoiceStatus) => { state.current = next; setStatus(next); }, []);
  const cleanup = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    pcm.current = [];
    pcmBytes.current = 0;
  }, []);
  const fail = useCallback((error: unknown) => {
    cleanup();
    update("error");
    setMessage(error instanceof Error ? error.message : "Microphone unavailable. You can type your question instead.");
  }, [cleanup, update]);
  const cancel = useCallback(() => {
    generation.current += 1;
    if (recorder.current?.state === "recording") recorder.current.stop();
    if (native.current) void g2.stopAudio();
    cleanup();
    update("idle");
    setMessage("");
    setTranscript("");
  }, [cleanup, g2.stopAudio, update]);
  const preview = useCallback(async (audio: Blob, token: number) => {
    if (token !== generation.current) return;
    cleanup();
    update("previewing");
    try {
      if (audio.size < 100) throw new Error("No audio was recorded. Please try again.");
      // Never upload or transcribe audio: the selected question is explicit demo data.
      const question = selectedQuestion.current;
      update("idle");
      callback.current(question);
      setTranscript(question);
      setMessage("Cocoon AI demo · sample question, not speech recognition.");
    } catch (error) { if (token === generation.current) fail(error); }
  }, [cleanup, fail, update]);
  const stop = useCallback(async () => {
    if (state.current === "requesting") {
      generation.current += 1; cleanup(); update("idle");
      if (native.current) await g2.stopAudio();
      return;
    }
    if (state.current !== "listening") return;
    update("previewing");
    if (native.current) {
      const token = generation.current;
      try {
        await g2.stopAudio();
        if (token !== generation.current) return;
        const audio = pcmToWav(pcm.current);
        await preview(audio, token);
      } catch (error) { if (token === generation.current) fail(error); }
    } else if (recorder.current?.state === "recording") recorder.current.stop();
  }, [cleanup, fail, g2.stopAudio, update, preview]);
  const start = useCallback(async () => {
    if (state.current === "listening" || state.current === "requesting" || state.current === "previewing") return;
    if (!consent) { setMessage("Allow the local microphone demo below before starting."); return; }
    const token = ++generation.current;
    setMessage(""); setTranscript(""); update("requesting");
    native.current = g2.status === "connected";
    try {
      if (native.current) {
        pcm.current = []; pcmBytes.current = 0;
        await g2.startAudio((chunk) => {
          if (token !== generation.current || pcmBytes.current + chunk.length > MAX_PCM_BYTES) return;
          pcm.current.push(new Uint8Array(chunk)); pcmBytes.current += chunk.length;
        });
        if (token !== generation.current) { await g2.stopAudio(); return; }
      } else {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Microphone recording needs a supported browser and a secure connection. You can type instead.");
        const media = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (token !== generation.current) { media.getTracks().forEach((track) => track.stop()); return; }
        stream.current = media;
        const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find((mime) => MediaRecorder.isTypeSupported(mime));
        const rec = new MediaRecorder(media, mimeType ? { mimeType } : {});
        recorder.current = rec;
        const chunks: Blob[] = [];
        rec.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        rec.onstop = () => { void preview(new Blob(chunks, { type: rec.mimeType }), token); };
        rec.onerror = () => { generation.current += 1; fail(new Error("The microphone recording was interrupted.")); };
        rec.start(250);
      }
      update("listening");
      timer.current = setTimeout(() => { void stop(); }, MAX_RECORDING_MS);
    } catch (error) { if (token === generation.current) fail(error); }
  }, [consent, fail, g2.status, g2.startAudio, g2.stopAudio, stop, update, preview]);
  useEffect(() => () => {
    generation.current += 1;
    if (recorder.current?.state === "recording") recorder.current.stop();
    void g2.stopAudio(); cleanup();
  }, [cleanup, g2.stopAudio]);
  useEffect(() => {
    if (g2.status !== "connected" && native.current && (state.current === "listening" || state.current === "requesting")) {
      generation.current += 1; cleanup(); update("error"); setMessage("G2 disconnected. Please reconnect or use this device's microphone.");
    }
  }, [g2.status, cleanup, update]);
  return { status, consent, setConsent, message, transcript, demoQuestion, setDemoQuestion, start, stop, cancel };
}