import {
  Activity,
  Glasses,
  LoaderCircle,
  MapPin,
  Play,
  ShieldCheck,
} from "lucide-react";
import { useRef, type ReactNode } from "react";
import { CocoonIcon, TelegramIcon } from "./BrandIcons";
import type { EvenHubController } from "@/hooks/use-even-hub";

export function IntegrationPanel({
  g2,
  onTelegramDemo,
  onCocoonDemo,
  onSensorDemo,
}: {
  g2: EvenHubController;
  onTelegramDemo: () => void;
  onCocoonDemo: () => void;
  onSensorDemo: (live?: boolean) => void;
}) {
  const busy = g2.status === "connecting";
  const live = g2.status === "connected";
  const sensorChoice = useRef(0);
  return (
    <section className="mx-auto max-w-7xl px-5 pb-8" aria-labelledby="integrations-title">
      <div className="rounded-3xl border border-border/40 bg-card/50 backdrop-blur p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Hackathon integration lab
            </p>
            <h2 id="integrations-title" className="mt-2 font-display text-3xl font-bold">
              One showcase. Real deployment paths.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Run the complete story without hardware, or open this page inside Even App to use the
              installed G2 controls, phone location, and head-motion APIs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                sensorChoice.current += 1;
                g2.simulate();
                onSensorDemo();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Play className="h-4 w-4" /> Run sensor demo
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const choice = ++sensorChoice.current;
                void g2.connect().then((ok) => {
                  if (ok && choice === sensorChoice.current) onSensorDemo(true);
                });
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold transition hover:border-primary disabled:opacity-60"
            >
              {busy ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Glasses className="h-4 w-4" />
              )}
              {live ? "Reconnect real G2" : "Connect real G2"}
            </button>
          </div>
        </div>

        <div
          className="mt-4 flex items-start gap-2 rounded-2xl bg-background/50 px-4 py-3 text-sm text-muted-foreground"
          role="status"
        >
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${live ? "bg-primary" : g2.status === "simulated" ? "bg-accent" : "bg-muted-foreground"}`}
          />
          <span>{g2.message}</span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <IntegrationCard
            icon={<TelegramIcon />}
            title="Telegram"
            status="Ready to link"
          >
            <p>
              Two-way family commands, reminder storage, and AI answers through a verified bot
              webhook. Done alerts are demonstrated above.
            </p>
            <button
              type="button"
              onClick={onTelegramDemo}
              className="mt-3 text-sm font-semibold text-primary hover:underline"
            >
              Try a family command →
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              The phone chat above stays a demo until a bot is linked.
            </p>
          </IntegrationCard>

          <IntegrationCard
            icon={<CocoonIcon />}
            title="Cocoon AI"
            status="Demo + live adapter"
          >
            <p>
              A question and family context go to your Cocoon client; one short, calm answer returns
              to the glasses.
            </p>
            <button
              type="button"
              onClick={onCocoonDemo}
              className="mt-3 text-sm font-semibold text-primary hover:underline"
            >
              Preview “What’s next?” →
            </button>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Server-only credentials. No
              API keys in the browser or repository.
            </p>
          </IntegrationCard>

          <IntegrationCard
            icon={<MapPin className="h-5 w-5" />}
            title="Location"
            status={live ? "G2 live" : "Simulated preview"}
          >
            {g2.location ? (
              <div className="font-mono text-sm">
                <p>
                  {g2.location.latitude.toFixed(4)}°, {g2.location.longitude.toFixed(4)}°
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ±{Math.round(g2.location.accuracy ?? 0)} m ·{" "}
                  {live ? "Even App" : "example Berlin location"}
                </p>
              </div>
            ) : (
              <p>
                Run the demo to preview a home-location cue. Real mode uses the phone’s Even App
                location permission.
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              The showcase does not upload or retain precise coordinates.
            </p>
          </IntegrationCard>

          <IntegrationCard
            icon={<Activity className="h-5 w-5" />}
            title="Head motion"
            status={live ? "IMU live" : "Simulated preview"}
          >
            {g2.motion ? (
              <div className="grid grid-cols-3 gap-2 font-mono text-sm">
                {(["x", "y", "z"] as const).map((axis) => (
                  <div key={axis} className="rounded-xl bg-background/60 p-2 text-center">
                    <span className="block text-xs uppercase text-muted-foreground">{axis}</span>
                    {g2.motion?.[axis].toFixed(2)}
                  </div>
                ))}
              </div>
            ) : (
              <p>
                Run the demo to preview the G2 IMU stream used for head-orientation and motion
                experiences.
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Raw axes are shown; no medical or fall detection is claimed.
            </p>
          </IntegrationCard>
        </div>
      </div>
    </section>
  );
}

function IntegrationCard({
  icon,
  title,
  status,
  children,
}: {
  icon: ReactNode;
  title: string;
  status: string;
  children: ReactNode;
}) {
  return (
    <article className="flex min-h-[230px] flex-col rounded-2xl border border-border bg-background/35 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-primary">{icon}</span>
          {title}
        </div>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {status}
        </span>
      </div>
      <div className="flex flex-1 flex-col text-sm leading-relaxed">{children}</div>
    </article>
  );
}
