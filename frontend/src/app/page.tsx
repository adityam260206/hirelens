import Link from "next/link";
import { BackendStatus } from "@/components/system/BackendStatus";

const differentiators = [
  {
    title: "Structured evidence, not vibes",
    body: "Every match score is built from a deterministic scoring engine over structured resume and job data — not a single opaque LLM opinion.",
  },
  {
    title: "Strengths and gaps, explained",
    body: "See exactly which requirements are satisfied, which are missing, and the resume evidence behind each — in plain language.",
  },
  {
    title: "Humans make the call",
    body: "AI is decision support. Recruiters shortlist, interview, and hire — HireLens never acts on your behalf.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">HireLens</span>
          <nav className="flex items-center gap-3">
            <BackendStatus />
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-surface"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-brand">Explainable Candidate Intelligence</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              From resume to offer — one intelligent hiring workspace.
            </h1>
            <p className="mt-5 text-lg text-muted">
              HireLens matches candidates to jobs with evidence-backed scoring, surfaces skill gaps
              instead of hiding them, and keeps every hiring decision in human hands.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href="/register"
                className="rounded-md bg-brand px-5 py-3 text-sm font-medium text-brand-foreground hover:opacity-90"
              >
                Start hiring smarter
              </Link>
              <Link
                href="/jobs"
                className="rounded-md border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-surface"
              >
                Browse open roles
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid gap-8 sm:grid-cols-3">
              {differentiators.map((item) => (
                <div key={item.title}>
                  <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-muted">
          HireLens · AI-generated analysis is decision support. Recruiters remain responsible for
          hiring decisions.
        </div>
      </footer>
    </div>
  );
}
