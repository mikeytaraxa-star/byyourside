import { useState } from "react";
import { ArrowDown, ArrowUp, Check, List, Mic, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { useVoiceQuestion } from "@/hooks/use-voice-question";
import type { Gesture, GestureSource } from "./gestures";

export function InteractionControls({ voice, live, lastGesture, onGesture, onQuestion }: {
  voice: ReturnType<typeof useVoiceQuestion>;
  live: boolean;
  lastGesture: string;
  onGesture: (gesture: Gesture, source: GestureSource) => void;
  onQuestion: (question: string) => void;
}) {
  const [source, setSource] = useState<GestureSource>("Right temple");
  const [question, setQuestion] = useState("");
  const recording = voice.status === "listening";
  const busy = voice.status === "requesting" || voice.status === "previewing";
  return (
    <div className="space-y-4 border-y border-border py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Glasses interactions</h3>
        <span className="text-xs text-muted-foreground">{live ? "G2 connected · on-screen controls are simulations" : "No hardware · gesture simulation"}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted-foreground" htmlFor="gesture-source">Simulated input</label>
        <select id="gesture-source" className="rounded-md border border-input bg-background px-2 py-1 text-sm" value={source}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "Right temple" || value === "Left temple" || value === "R1 ring") setSource(value);
          }}>
          <option>Right temple</option><option>Left temple</option><option>R1 ring</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => onGesture("tap", source)}><Check /> Single tap</Button>
        <Button variant="outline" onClick={() => onGesture("double-tap", source)}><List /> Double tap</Button>
        <Button variant="outline" onClick={() => onGesture("swipe-up", source)}><ArrowUp /> Previous</Button>
        <Button variant="outline" onClick={() => onGesture("swipe-down", source)}><ArrowDown /> Next</Button>
        <Button variant="outline" disabled={busy} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); onGesture("hold", source); }}
          onPointerUp={() => onGesture("release", source)} onPointerCancel={() => onGesture("release", source)}
          onKeyDown={(event) => { if ((event.key === " " || event.key === "Enter") && !event.repeat) { event.preventDefault(); onGesture("hold", source); } }}
          onKeyUp={(event) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); onGesture("release", source); } }}><Mic /> Hold to talk</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Menu simulation</span>
        <Button size="sm" variant="ghost" onClick={() => onGesture("menu-done", "G2 menu")}>Done</Button>
        <Button size="sm" variant="ghost" onClick={() => onGesture("menu-next", "G2 menu")}>Next reminder</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onGesture("menu-ask", "G2 menu")}>Ask a question</Button>
        <Button size="sm" variant="ghost" onClick={() => onGesture("menu-today", "G2 menu")}>Today</Button>
      </div>
      <p role="status" className="text-xs text-muted-foreground">{lastGesture || "No gesture yet"}</p>
      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Ask ByYourSide</h3>
          <span className="text-xs text-muted-foreground">Cocoon AI · demo data</span>
        </div>
        <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <input type="checkbox" className="mt-0.5 accent-primary" checked={voice.consent} disabled={busy || recording} onChange={(event) => voice.setConsent(event.target.checked)} />
          <span>Allow the local microphone demo. Audio is discarded, never uploaded. Sample questions and answers use demo data, not speech recognition. Up to 20 seconds.</span>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="voice-demo-question" className="text-xs text-muted-foreground">Sample question</label>
          <select id="voice-demo-question" value={voice.demoQuestion} disabled={busy || recording}
            onChange={(event) => { voice.setDemoQuestion(event.target.value); onQuestion(event.target.value); }} className="rounded-md border border-input bg-background px-2 py-1 text-sm">
            <option>What's next?</option><option>Who is Anna?</option><option>Who is Peter?</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={busy} onClick={() => { if (recording) void voice.stop(); else void voice.start(); }}>
            {recording ? <Square /> : <Mic />}
            {recording ? "Stop listening" : voice.status === "previewing" ? "Showing demo…" : voice.status === "requesting" ? "Opening microphone…" : "Try microphone demo"}
          </Button>
          <span role="status" className="text-sm text-muted-foreground">{recording ? "Listening…" : voice.message}</span>
        </div>
        {voice.transcript && <p className="text-sm"><span className="text-muted-foreground">Demo question: </span>{voice.transcript}</p>}
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (question.trim()) { onQuestion(question.trim()); setQuestion(""); } }}>
          <input aria-label="Type a question" placeholder="What’s next?" maxLength={300} value={question} onChange={(event) => setQuestion(event.target.value)} className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <Button type="submit" size="icon" variant="outline" disabled={!question.trim()} aria-label="Ask typed question"><Send /></Button>
        </form>
      </div>
    </div>
  );
}