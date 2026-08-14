"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { Alert } from "@/components/ui/Alert";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { ApiClientError } from "@/lib/api-client";
import { jobsService } from "@/services/jobs.service";
import type { JobDetail } from "@/types/job";

export default function JobPipelinePage() {
  return (
    <RequireRole roles={["RECRUITER"]}>
      <DashboardShell>
        <PipelineView />
      </DashboardShell>
    </RequireRole>
  );
}

function PipelineView() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    jobsService
      .get(params.id)
      .then(setJob)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load this job."));
  }, [params.id]);

  return (
    <div>
      {error && <Alert>{error}</Alert>}
      {!error && !job && <FullScreenLoading />}
      {job && (
        <>
          <Link href={`/recruiter/jobs/${job.id}`} className="text-sm text-brand hover:underline">
            ← Back to {job.title}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Pipeline · {job.title}</h1>
          <p className="mt-1 text-sm text-muted">
            Drag a card to move it forward one stage, or into Rejected at any point.
          </p>
          <div className="mt-6">
            <KanbanBoard jobId={job.id} />
          </div>
        </>
      )}
    </div>
  );
}
