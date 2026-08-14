"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { applicationsService } from "@/services/applications.service";
import { interviewsService } from "@/services/interviews.service";
import { resumesService } from "@/services/resumes.service";
import type { Interview } from "@/types/interview";
import type { Resume } from "@/types/resume";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CandidateDashboardPage() {
  return (
    <RequireRole roles={["CANDIDATE"]}>
      <DashboardShell>
        <CandidateDashboard />
      </DashboardShell>
    </RequireRole>
  );
}

function CandidateDashboard() {
  const { user } = useAuth();
  const [applicationCount, setApplicationCount] = useState<number | null>(null);
  const [pendingOffers, setPendingOffers] = useState<number | null>(null);
  const [interviews, setInterviews] = useState<Interview[] | null>(null);
  const [resumes, setResumes] = useState<Resume[] | null>(null);

  useEffect(() => {
    resumesService.list().then(setResumes).catch(() => setResumes([]));
    applicationsService
      .listMine()
      .then((result) => {
        setApplicationCount(result.total);
        setPendingOffers(result.items.filter((a) => a.offer?.status === "SENT").length);
      })
      .catch(() => {
        setApplicationCount(null);
        setPendingOffers(null);
      });
    interviewsService
      .listMine()
      .then((result) => setInterviews(result.items.filter((i) => i.status === "SCHEDULED")))
      .catch(() => setInterviews([]));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Welcome, {user?.firstName}</h1>
          <p className="mt-1 text-sm text-muted">Your applications, interviews, and offers in one place.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/candidate/applications">
            <Button variant="secondary">Applications</Button>
          </Link>
          <Link href="/candidate/profile">
            <Button variant="secondary">Edit profile</Button>
          </Link>
          <Link href="/candidate/resume">
            <Button>Resume</Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Profile completion", value: `${user?.candidate?.profileCompletion ?? 0}%` },
          {
            label: "Resume",
            value: resumes === null ? "–" : resumes.length === 0 ? "Not uploaded" : resumes[0].parseStatus,
          },
          { label: "Applications", value: applicationCount ?? "–" },
          { label: "Upcoming interviews", value: interviews?.length ?? "–" },
          { label: "Offers awaiting response", value: pendingOffers ?? "–" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-surface p-5">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {pendingOffers !== null && pendingOffers > 0 && (
        <div className="mt-8 rounded-lg border border-brand/30 bg-brand-muted p-4">
          <p className="text-sm font-medium text-foreground">
            You have {pendingOffers} offer{pendingOffers > 1 ? "s" : ""} waiting for a response.
          </p>
          <Link href="/candidate/applications" className="text-sm text-brand hover:underline">
            Review and respond →
          </Link>
        </div>
      )}

      {interviews !== null && interviews.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">Upcoming interviews</h2>
          <div className="mt-3 flex flex-col gap-2">
            {interviews.map((interview) => (
              <div key={interview.id} className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{interview.application.job.title}</p>
                  <p className="text-xs text-muted">
                    {interview.type.charAt(0) + interview.type.slice(1).toLowerCase()} interview ·{" "}
                    {formatDateTime(interview.scheduledAt)}
                  </p>
                </div>
                <Badge variant="brand">{interview.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted">
          <Link href="/jobs" className="font-medium text-brand hover:underline">
            Browse open roles
          </Link>{" "}
          to apply.
        </p>
      </div>
    </div>
  );
}
