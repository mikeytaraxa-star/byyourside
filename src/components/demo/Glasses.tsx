import { useState, type ReactNode } from "react";

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

/** First-person "through the glasses" view: room behind, HUD floating in front. */
export function ThroughView({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,oklch(0.45_0.06_60),transparent_60%),radial-gradient(ellipse_at_80%_30%,oklch(0.55_0.05_90),transparent_55%),linear-gradient(180deg,oklch(0.35_0.03_70),oklch(0.22_0.03_60))] blur-[2px]" />
      <div className="absolute bottom-0 left-[10%] h-[35%] w-[30%] rounded-t-3xl bg-background/40 blur-sm" />
      <div className="absolute right-[15%] top-[20%] h-[30%] w-[18%] rounded-lg border-4 border-foreground/10 bg-foreground/5 blur-[1px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,oklch(0_0_0/0.75))]" />
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/** The 576x288 G2 display, rendered in green monochrome. */
export function Hud({ title, body, footer, alert }: { title: string; body: string; footer?: string; alert?: boolean }) {
  return (
    <div key={title + body} className="hud-in hud-glow flex aspect-[2/1] w-[min(92%,440px)] flex-col justify-between rounded-md p-4 font-mono text-hud">
      <div className="flex justify-between text-xs opacity-80"><span>{alert ? "⚠ " : ""}{title}</span><span>RECALL</span></div>
      <div className="text-center text-2xl font-bold leading-tight sm:text-[1.7rem]">{body}</div>
      <div className="text-center text-xs opacity-80">{footer}</div>
    </div>
  );
}
