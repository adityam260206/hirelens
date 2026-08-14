"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { interviewsService } from "@/services/interviews.service";
import type { Interview } from "@/types/interview";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InterviewerDashboardPage() {
  return (
    <RequireRole roles={["INTERVIEWER"]}>
      <DashboardShell>
        <InterviewerDashboard />
      </DashboardShell>
    </RequireRole>
  );
}

function InterviewerDashboard() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[] | null>(null);

  useEffect(() => {
    interviewsService
      .listMine()
      .then((result) => setInterviews(result.items))
      .catch(() => setInterviews([]));
  }, []);

  const upcoming = interviews?.filter((i) => i.status === "SCHEDULED") ?? [];
  const pendingFeedback = interviews?.filter((i) => i.status === "COMPLETED" && !i.feedback) ?? [];
  const completed = interviews?.filter((i) => i.status === "COMPLETED") ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Welcome, {user?.firstName}</h1>
      <p className="mt-1 text-sm text-muted">Your assigned interviews and pending feedback.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Upcoming interviews", value: upcoming.length },
          { label: "Pending feedback", value: pendingFeedback.length },
          { label: "Completed", value: completed.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-surface p-5">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{interviews === null ? "–" : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">Your interviews</h2>
        {interviews === null && <FullScreenLoading />}
        {interviews !== null && interviews.length === 0 && (
          <p className="mt-2 text-sm text-muted">No interviews assigned yet.</p>
        )}
        {interviews !== null && interviews.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {interviews.map((interview) => (
              <Link
                key={interview.id}
                href={`/interviewer/interviews/${interview.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-4 hover:border-brand/40"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {interview.application.candidate.user.firstName} {interview.application.candidate.user.lastName}
                    {" · "}
                    {interview.application.job.title}
                  </p>
                  <p className="text-xs text-muted">{formatDateTime(interview.scheduledAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {interview.status === "COMPLETED" && !interview.feedback && (
                    <Badge variant="warning">Feedback needed</Badge>
                  )}
                  <Badge
                    variant={
                      interview.status === "SCHEDULED"
                        ? "brand"
                        : interview.status === "COMPLETED"
                          ? "success"
                          : "danger"
                    }
                  >
                    {interview.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
