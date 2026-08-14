"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { Alert } from "@/components/ui/Alert";
import { FunnelChart } from "@/components/analytics/FunnelChart";
import { ApiClientError } from "@/lib/api-client";
import { analyticsService } from "@/services/analytics.service";
import type { AnalyticsOverview, FunnelStage } from "@/types/analytics";

export default function AnalyticsPage() {
  return (
    <RequireRole roles={["RECRUITER"]}>
      <DashboardShell>
        <Analytics />
      </DashboardShell>
    </RequireRole>
  );
}

function Analytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([analyticsService.overview(), analyticsService.funnel()])
      .then(([o, f]) => {
        setOverview(o);
        setFunnel(f);
      })
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load analytics."));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!overview || !funnel) return <FullScreenLoading />;

  const stats = [
    { label: "Active jobs", value: overview.activeJobs },
    { label: "Total applications", value: overview.totalApplications },
    { label: "Shortlisted", value: overview.candidatesShortlisted },
    { label: "Interviews", value: overview.interviews },
    { label: "Offers", value: overview.offers },
    { label: "Hires", value: overview.hires },
    {
      label: "Offer acceptance rate",
      value: overview.offerAcceptanceRate === null ? "–" : `${overview.offerAcceptanceRate}%`,
    },
    {
      label: "Avg. time to hire",
      value: overview.avgTimeToHireDays === null ? "–" : `${overview.avgTimeToHireDays}d`,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
      <p className="mt-1 text-sm text-muted">Real numbers from your hiring pipeline — nothing simulated.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-surface p-5">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold text-foreground">Hiring funnel</h2>
        <p className="mt-1 text-xs text-muted">Applications currently at each pipeline stage, across all jobs.</p>
        {overview.totalApplications === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
            No applications yet — the funnel will fill in once candidates start applying.
          </div>
        ) : (
          <div className="mt-4">
            <FunnelChart data={funnel} />
          </div>
        )}
      </div>
    </div>
  );
}
