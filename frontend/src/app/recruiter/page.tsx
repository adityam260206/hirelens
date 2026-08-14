"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { jobsService } from "@/services/jobs.service";
import { applicationsService } from "@/services/applications.service";
import { interviewsService } from "@/services/interviews.service";

export default function RecruiterDashboardPage() {
  return (
    <RequireRole roles={["RECRUITER"]}>
      <DashboardShell>
        <RecruiterDashboard />
      </DashboardShell>
    </RequireRole>
  );
}

function RecruiterDashboard() {
  const { user } = useAuth();
  const [activeJobs, setActiveJobs] = useState<number | null>(null);
  const [applications, setApplications] = useState<number | null>(null);
  const [interviewsScheduled, setInterviewsScheduled] = useState<number | null>(null);
  const [offersOut, setOffersOut] = useState<number | null>(null);

  useEffect(() => {
    jobsService
      .list({ scope: "company", status: "PUBLISHED", pageSize: 1 })
      .then((result) => setActiveJobs(result.total))
      .catch(() => setActiveJobs(null));
    applicationsService
      .listMine()
      .then((result) => {
        setApplications(result.total);
        setOffersOut(result.items.filter((a) => a.offer?.status === "SENT").length);
      })
      .catch(() => {
        setApplications(null);
        setOffersOut(null);
      });
    interviewsService
      .listMine()
      .then((result) => setInterviewsScheduled(result.items.filter((i) => i.status === "SCHEDULED").length))
      .catch(() => setInterviewsScheduled(null));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {user?.company?.name ?? "Your company"}
          </h1>
          <p className="mt-1 text-sm text-muted">Hiring pipeline overview for {user?.firstName}.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/recruiter/analytics">
            <Button variant="secondary">Analytics</Button>
          </Link>
          <Link href="/recruiter/team">
            <Button variant="secondary">Team</Button>
          </Link>
          <Link href="/recruiter/candidates">
            <Button variant="secondary">Candidates</Button>
          </Link>
          <Link href="/recruiter/jobs">
            <Button>Manage jobs</Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active jobs", value: activeJobs ?? "–" },
          { label: "Applications", value: applications ?? "–" },
          { label: "Interviews scheduled", value: interviewsScheduled ?? "–" },
          { label: "Offers out", value: offersOut ?? "–" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-surface p-5">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
