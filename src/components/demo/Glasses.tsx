import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import dailyLife from "@/assets/daily_life_pov.mp4.asset.json";

const G2Scene = lazy(() => import("./G2Scene"));

/** Interactive 3D Even G2 model (client-only); the HUD sits in the upper-right of the right lens. */
export function Glasses3D({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  return <Suspense fallback={null}><G2Scene hud={children} /></Suspense>;
}

/** First-person "through the glasses" view: looping daily-life video behind the HUD. */
export function ThroughView({ children, onFullscreen }: { children: ReactNode; onFullscreen?: () => void }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <video src={dailyLife.url} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,oklch(0.1_0.02_50/0.7))]" />
      <div className="absolute right-[6%] top-[7%] w-[44%] max-w-[340px]">{children}</div>
      {onFullscreen && (
        <button onClick={onFullscreen} className="absolute bottom-3 right-3 rounded-full bg-background/70 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur hover:bg-primary hover:text-primary-foreground">⛶ Full screen</button>
      )}
    </div>
  );
}

/** Fullscreen film: glasses go on, the day plays once through the lenses, glasses come off. */
export function GlassesFilm({ hud, onClose }: { hud: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"on" | "play" | "off">("on");
  useEffect(() => {
    ref.current?.requestFullscreen?.().catch(() => {});
    const t = setTimeout(() => { setPhase("play"); vid.current?.play().catch(() => {}); }, 1700);
    const exit = () => { if (!document.fullscreenElement) onClose(); };
    document.addEventListener("fullscreenchange", exit);
    return () => { clearTimeout(t); document.removeEventListener("fullscreenchange", exit); };
  }, [onClose]);
  const finish = () => {
    setPhase("off");
    setTimeout(() => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); onClose(); }, 1500);
  };
  return (
    <div ref={ref} className="fixed inset-0 z-50 overflow-hidden bg-background">
      <video ref={vid} src={dailyLife.url} playsInline onEnded={finish} className="absolute inset-0 h-full w-full object-cover" />
      <div className={`absolute inset-0 ${phase === "off" ? "lens-fog" : "lens-clear"}`} />
      <div className={`pointer-events-none absolute inset-0 ${phase === "off" ? "glasses-off" : "glasses-on"}`}>
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="h-full w-full text-frame">
          <defs><mask id="lenses"><rect width="1600" height="900" fill="white" /><path d="M120,430 C120,250 250,175 450,175 C640,175 780,215 780,400 C780,610 630,730 450,730 C260,730 120,610 120,430 Z" fill="black" /><path d="M820,430 C820,250 950,175 1150,175 C1340,175 1480,215 1480,400 C1480,610 1330,730 1150,730 C960,730 820,610 820,430 Z" fill="black" /></mask></defs>
          <rect width="1600" height="900" fill="currentColor" opacity="0.94" mask="url(#lenses)" />
          <path d="M120,430 C120,250 250,175 450,175 C640,175 780,215 780,400 C780,610 630,730 450,730 C260,730 120,610 120,430 Z" fill="none" stroke="currentColor" strokeWidth="38" />
          <path d="M820,430 C820,250 950,175 1150,175 C1340,175 1480,215 1480,400 C1480,610 1330,730 1150,730 C960,730 820,610 820,430 Z" fill="none" stroke="currentColor" strokeWidth="38" />
          <path d="M760,300 Q800,250 840,300" fill="none" stroke="currentColor" strokeWidth="34" />
          <rect x="1440" y="250" width="160" height="70" rx="18" fill="currentColor" />
          <rect x="0" y="250" width="160" height="70" rx="18" fill="currentColor" />
        </svg>
      </div>
      {phase === "play" && <div className="hud-in absolute right-[12%] top-[24%] w-[min(24vw,340px)]">{hud}</div>}
      <button onClick={finish} className="absolute right-6 top-6 rounded-full bg-background/60 px-4 py-2 text-sm text-foreground backdrop-blur">Take glasses off ✕</button>
    </div>
  );
}

/** The 576x288 G2 display, rendered in green monochrome. */
export function Hud({ title, body, footer, alert }: { title: string; body: string; footer?: string; alert?: boolean }) {
  return (
    <div key={title + body} className="hud-in hud-glow flex aspect-[2/1] w-full flex-col justify-between rounded-xl bg-background/25 p-3 font-mono text-hud backdrop-blur-[2px]">
      <div className="flex justify-between text-[10px] opacity-80"><span>{alert ? "⚠ " : ""}{title}</span><span>BYYOURSIDE</span></div>
      <div className="text-center text-base font-bold leading-snug sm:text-lg">{body}</div>
      <div className="text-center text-[10px] opacity-80">{footer}</div>
    </div>
  );
}
