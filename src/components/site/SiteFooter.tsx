import { Link } from "@tanstack/react-router";
import logo from "@/assets/byyourside_heart_hand_logo.svg.asset.json";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <img src={logo.url} alt="" className="h-6 w-6" /> ByYourSide
        </Link>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/install" className="hover:text-primary">Install & how to use</Link>
          <Link to="/docs" className="hover:text-primary">Docs</Link>
          <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
        </nav>
        <p className="text-xs">© {new Date().getFullYear()} ByYourSide · Hackathon prototype</p>
      </div>
    </footer>
  );
}

export function DocPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link to="/" className="flex items-center gap-2 font-semibold"><img src={logo.url} alt="" className="h-8 w-8" /> ByYourSide</Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Back to demo</Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-8 pt-6">
        <h1 className="font-display text-4xl font-bold">{title}</h1>
        <p className="mt-3 text-muted-foreground">{intro}</p>
        <div className="mt-10 space-y-10 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_li]:py-0.5 [&_ol>li]:list-decimal [&_p]:leading-relaxed [&_p]:text-foreground/90 [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
