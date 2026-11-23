import { useEffect, useRef, useState, type ReactNode } from "react";
import dailyLife from "@/assets/daily_life_loop.mp4.asset.json";

/** 3D model of Even G2 style glasses; HUD content shows in the lenses. */
export function Glasses3D({ children }: { children: ReactNode }) {
  const [rot, setRot] = useState({ x: -8, y: -18 });
  return (
    <div
      className="flex h-full w-full items-center justify-center [perspective:1100px]"
      onPointerMove={(e) => {
        const b = e.currentTarget.getBoundingClientRect();
        setRot({ x: ((e.clientY - b.top) / b.height - 0.5) * -25, y: ((e.clientX - b.left) / b.width - 0.5) * 45 });
      }}
      onPointerLeave={() => setRot({ x: -8, y: -18 })}
    >
      <div className="relative transition-transform duration-200 ease-out [transform-style:preserve-3d]" style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}>
        {/* temples */}
        <div className="absolute left-0 top-6 h-3 w-64 origin-left rounded-full bg-frame shadow-lg" style={{ transform: "rotateY(90deg) translateZ(2px)" }} />
        <div className="absolute right-0 top-6 h-3 w-64 origin-right rounded-full bg-frame shadow-lg" style={{ transform: "rotateY(-90deg) translateZ(2px)" }} />
        <div className="flex items-center" style={{ transform: "translateZ(10px)" }}>
          <Lens>{children}</Lens>
          <div className="mx-1 h-3 w-8 rounded-t-full border-x-4 border-t-4 border-frame" />
          <Lens>{children}</Lens>
        </div>
        <div className="absolute -bottom-10 left-1/2 h-6 w-[90%] -translate-x-1/2 rounded-full bg-frame/60 blur-xl" style={{ transform: "translateZ(-40px)" }} />
      </div>
    </div>
  );
}

function Lens({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-36 w-52 overflow-hidden rounded-[45%_45%_42%_42%/40%_40%_55%_55%] border-[7px] border-frame bg-lens shadow-[inset_0_0_30px_rgba(0,0,0,.6)] sm:h-40 sm:w-60">
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/15 via-transparent to-transparent" />
      <div className="absolute inset-0 flex scale-[0.62] items-center justify-center">{children}</div>
    </div>
  );
}

/** First-person "through the glasses" view: looping daily-life video behind the HUD. */
export function ThroughView({ children, onFullscreen }: { children: ReactNode; onFullscreen?: () => void }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <video src={dailyLife.url} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,oklch(0.1_0.02_50/0.7))]" />
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
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
          <defs><mask id="lenses"><rect width="1600" height="900" fill="white" /><ellipse cx="440" cy="460" rx="350" ry="300" fill="black" /><ellipse cx="1160" cy="460" rx="350" ry="300" fill="black" /></mask></defs>
          <rect width="1600" height="900" fill="currentColor" opacity="0.92" mask="url(#lenses)" />
          <ellipse cx="440" cy="460" rx="350" ry="300" fill="none" stroke="currentColor" strokeWidth="34" />
          <ellipse cx="1160" cy="460" rx="350" ry="300" fill="none" stroke="currentColor" strokeWidth="34" />
        </svg>
      </div>
      {phase === "play" && <div className="absolute inset-x-0 top-[38%] flex justify-center">{hud}</div>}
      <button onClick={finish} className="absolute right-6 top-6 rounded-full bg-background/60 px-4 py-2 text-sm text-foreground backdrop-blur">Take glasses off ✕</button>
    </div>
  );
}

/** The 576x288 G2 display, rendered in green monochrome. */
export function Hud({ title, body, footer, alert }: { title: string; body: string; footer?: string; alert?: boolean }) {
  return (
    <div key={title + body} className="hud-in hud-glow flex aspect-[2/1] w-[min(92%,440px)] flex-col justify-between rounded-md p-4 font-mono text-hud">
      <div className="flex justify-between text-xs opacity-80"><span>{alert ? "⚠ " : ""}{title}</span><span>BYYOURSIDE</span></div>
      <div className="text-center text-2xl font-bold leading-tight sm:text-[1.7rem]">{body}</div>
      <div className="text-center text-xs opacity-80">{footer}</div>
    </div>
  );
}
