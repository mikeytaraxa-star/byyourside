import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/byyourside_heart_hand_logo.svg.asset.json";
import { SiteFooter } from "@/components/site/SiteFooter";

const PAGES = 6;
const DESC = "The full ByYourSide demo-day breakdown: problem, solution, how it works, glasses controls, integrations, privacy, current status and roadmap.";

export const Route = createFileRoute("/breakdown")({
  head: () => ({ meta: [
    { title: "Project breakdown — ByYourSide" },
    { name: "description", content: DESC },
    { property: "og:title", content: "Project breakdown — ByYourSide" },
    { property: "og:description", content: DESC },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Breakdown,
});

function Breakdown() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
        <Link to="/" className="flex items-center gap-2 font-semibold"><img src={logo.url} alt="" className="h-8 w-8" /> ByYourSide</Link>
        <div className="flex items-center gap-4 text-sm">
          <a href="/byyourside-breakdown.pdf" download className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90">Download PDF</a>
          <Link to="/" className="text-muted-foreground hover:text-primary">← Back to demo</Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-8 pt-4">
        <h1 className="font-display text-4xl font-bold">Project breakdown</h1>
        <p className="mt-3 text-muted-foreground">{DESC}</p>
        <div className="mt-8 space-y-6">
          {Array.from({ length: PAGES }, (_, i) => (
            <img key={i} src={`/breakdown/page-${i + 1}.webp`} alt={`Breakdown page ${i + 1} of ${PAGES}`} loading={i === 0 ? "eager" : "lazy"} width={1075} height={1520} className="h-auto w-full rounded-lg shadow-2xl ring-1 ring-border" />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
