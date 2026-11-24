import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/byyourside_heart_hand_logo.svg.asset.json";
import demoVideo from "@/assets/videos/byyourside_hackathon_narrated_v3.mp4.asset.json";
import cover from "@/assets/videos/byyourside_demo_cover.jpg.asset.json";
import { SiteFooter } from "@/components/site/SiteFooter";

const TITLE = "Demo video — ByYourSide";
const DESCRIPTION = "Watch Mikey’s three-minute ByYourSide hackathon demo: the personal story, Telegram family care, Even G2 glasses, reminders, /findme and Cocoon’s planned private AI integration.";

export const Route = createFileRoute("/demovideo")({
  head: () => ({ meta: [
    { title: TITLE },
    { name: "description", content: DESCRIPTION },
    { property: "og:title", content: TITLE },
    { property: "og:description", content: DESCRIPTION },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DemoVideoPage,
});

function DemoVideoPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <img src={logo.url} alt="" className="h-8 w-8" /> ByYourSide
        </Link>
        <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">Explore the app →</Link>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Hackathon submission</p>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">ByYourSide — Demo video</h1>
          </div>
          <p className="text-sm text-muted-foreground">Mikey · The Open Network · 3 minutes</p>
        </div>
        <video
          src={demoVideo.url}
          poster={cover.url}
          controls
          playsInline
          preload="metadata"
          aria-label="ByYourSide narrated hackathon demo"
          className="aspect-video w-full rounded-lg bg-card ring-1 ring-border"
        />
      </main>
      <SiteFooter />
    </div>
  );
}