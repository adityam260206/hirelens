"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { jobsService } from "@/services/jobs.service";
import { socialService } from "@/services/social.service";
import type { JobCard } from "@/types/job";
import type { NetworkUser, PostAuthor } from "@/types/social";

export function RightSidebar() {
  const { user } = useAuth();
  const [recommendedJobs, setRecommendedJobs] = useState<JobCard[]>([]);
  const [suggestedPeople, setSuggestedPeople] = useState<NetworkUser[]>([]);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch live jobs
    jobsService
      .list({ pageSize: 3 })
      .then((res) => setRecommendedJobs(res.items))
      .catch(() => {});

    // Fetch suggested connections
    if (user) {
      socialService
        .getNetwork(user.id)
        .then((net) => setSuggestedPeople(net.suggested.slice(0, 3)))
        .catch(() => {});
    }
  }, [user]);

  async function handleConnect(targetUserId: string) {
    if (!user) return;
    const author: PostAuthor = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      headline: user.role === "RECRUITER" ? "Recruiter" : "Candidate",
      role: user.role,
    };

    setConnectedIds((prev) => new Set(prev).add(targetUserId));
    try {
      await socialService.sendConnectionRequest(user.id, targetUserId, author);
    } catch {
      // ignore
    }
  }

  return (
    <aside className="w-full flex flex-col gap-4">
      {/* AI Career Copilot Card */}
      <div className="overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-surface to-brand/5 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-brand-foreground text-xs shadow-xs">
            ⚡
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">AI Career Intelligence</h3>
            <p className="text-[10px] text-brand font-semibold">Powered by Groq AI</p>
          </div>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          Get instant, explainable feedback on your resume, simulate realistic technical interviews, or generate tailored outreach.
        </p>

        <div className="mt-3 flex flex-col gap-1.5">
          <Link
            href="/ai-assistant?tab=resume"
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:border-brand hover:text-brand transition-colors"
          >
            <span>📄 ATS Resume Optimizer</span>
            <span className="text-muted">→</span>
          </Link>
          <Link
            href="/ai-assistant?tab=interview"
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:border-brand hover:text-brand transition-colors"
          >
            <span>🎯 Mock Interview Simulator</span>
            <span className="text-muted">→</span>
          </Link>
          <Link
            href="/ai-assistant?tab=outreach"
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:border-brand hover:text-brand transition-colors"
          >
            <span>✉️ Recruiter Outreach Generator</span>
            <span className="text-muted">→</span>
          </Link>
        </div>
      </div>

      {/* Suggested Open Roles */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-foreground">Recommended Jobs</h3>
          <Link href="/jobs" className="text-[11px] font-semibold text-brand hover:underline">
            View all
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {recommendedJobs.length === 0 ? (
            <p className="text-xs text-muted">No open roles found right now.</p>
          ) : (
            recommendedJobs.map((job) => (
              <div key={job.id} className="flex flex-col gap-1 border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-xs font-semibold text-foreground hover:text-brand transition-colors"
                >
                  {job.title}
                </Link>
                <p className="text-[11px] text-muted">{job.company.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="rounded-sm bg-brand/10 px-1.5 py-0.2 text-[10px] font-medium text-brand">
                    {job.workMode}
                  </span>
                  {job.salaryMin && (
                    <span className="text-[10px] text-muted">
                      ${job.salaryMin.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* People You May Know */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-foreground">People You May Know</h3>
          <Link href="/network" className="text-[11px] font-semibold text-brand hover:underline">
            Manage network
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {suggestedPeople.length === 0 ? (
            <p className="text-xs text-muted">All recommended connections connected.</p>
          ) : (
            suggestedPeople.map((person) => {
              const isPending = connectedIds.has(person.id);
              return (
                <div key={person.id} className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-bold">
                    {person.name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <Link
                      href={`/profile/${person.id}`}
                      className="truncate text-xs font-semibold text-foreground hover:text-brand block"
                    >
                      {person.name}
                    </Link>
                    <p className="truncate text-[10px] text-muted">{person.headline}</p>
                    <button
                      onClick={() => handleConnect(person.id)}
                      disabled={isPending}
                      className={`mt-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                        isPending
                          ? "border-muted bg-background text-muted"
                          : "border-brand text-brand hover:bg-brand hover:text-brand-foreground"
                      }`}
                    >
                      {isPending ? "Pending" : "+ Connect"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer credits */}
      <div className="px-2 text-[11px] text-muted/80 leading-relaxed">
        HireLens Professional Career Ecosystem · Explainable candidate intelligence and verified talent network.
      </div>
    </aside>
  );
}
