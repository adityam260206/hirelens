"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { Button } from "@/components/ui/Button";
import { JobStatusBadge } from "@/components/ui/Badge";
import { formatEmploymentType, formatWorkMode } from "@/lib/format";
import { jobsService } from "@/services/jobs.service";
import type { JobCard } from "@/types/job";

export default function RecruiterJobsPage() {
  return (
    <RequireRole roles={["RECRUITER"]}>
      <DashboardShell>
        <RecruiterJobsList />
      </DashboardShell>
    </RequireRole>
  );
}

function RecruiterJobsList() {
  const [jobs, setJobs] = useState<JobCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    jobsService
      .list({ scope: "company", pageSize: 50 })
      .then((result) => setJobs(result.items))
      .catch(() => setError("Could not load jobs right now."));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Jobs</h1>
          <p className="mt-1 text-sm text-muted">Every role your company has created.</p>
        </div>
        <Link href="/recruiter/jobs/new">
          <Button>New job</Button>
        </Link>
      </div>

      <div className="mt-8">
        {error && <p className="text-sm text-danger">{error}</p>}
        {!error && jobs === null && <FullScreenLoading />}
        {jobs !== null && jobs.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
            No jobs yet. Create your first one to start hiring.
          </div>
        )}
        {jobs !== null && jobs.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Applications</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border last:border-0 hover:bg-background">
                    <td className="px-4 py-3">
                      <Link href={`/recruiter/jobs/${job.id}`} className="font-medium text-foreground hover:text-brand">
                        {job.title}
                      </Link>
                      <p className="text-xs text-muted">
                        {formatWorkMode(job.workMode)} · {formatEmploymentType(job.employmentType)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <JobStatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">{formatEmploymentType(job.employmentType)}</td>
                    <td className="px-4 py-3 text-muted">{job._count.applications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
