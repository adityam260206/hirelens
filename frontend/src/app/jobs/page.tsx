"use client";

import { useEffect, useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { JobCard } from "@/components/jobs/JobCard";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { TextInput } from "@/components/ui/Field";
import { jobsService } from "@/services/jobs.service";
import type { JobCard as JobCardType } from "@/types/job";

export default function JobsBrowsePage() {
  const [jobs, setJobs] = useState<JobCardType[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      jobsService
        .list({ search: search || undefined, pageSize: 30 })
        .then((result) => setJobs(result.items))
        .catch(() => setError("Could not load jobs right now."));
    }, 250);

    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground">Open roles</h1>
        <p className="mt-1 text-sm text-muted">Browse published positions across every company on HireLens.</p>

        <div className="mt-6 max-w-sm">
          <TextInput
            label="Search"
            placeholder="Title, e.g. Software Engineer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mt-8">
          {error && <p className="text-sm text-danger">{error}</p>}
          {!error && jobs === null && <FullScreenLoading />}
          {jobs !== null && jobs.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
              No open roles match your search right now.
            </div>
          )}
          {jobs !== null && jobs.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} href={`/jobs/${job.id}`} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
