"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { ApplySection } from "@/components/jobs/ApplySection";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { ApiClientError } from "@/lib/api-client";
import { formatDate, formatEmploymentType, formatExperienceRange, formatSalaryRange, formatWorkMode } from "@/lib/format";
import { jobsService } from "@/services/jobs.service";
import type { JobDetail } from "@/types/job";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, status } = useAuth();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    jobsService
      .get(params.id)
      .then(setJob)
      .catch((err) => {
        setError(err instanceof ApiClientError && err.status === 404 ? "This job could not be found." : "Could not load this job right now.");
      });
  }, [params.id]);

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        {error && <p className="text-sm text-danger">{error}</p>}
        {!error && !job && <FullScreenLoading />}
        {job && (
          <>
            <p className="text-sm text-muted">{job.company.name}</p>
            <h1 className="mt-1 text-3xl font-semibold text-foreground">{job.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="brand">{formatWorkMode(job.workMode)}</Badge>
              <Badge>{formatEmploymentType(job.employmentType)}</Badge>
              <Badge>{formatExperienceRange(job.minExperience, job.maxExperience)}</Badge>
              {job.location && <Badge>{job.location}</Badge>}
              {formatSalaryRange(job.salaryMin, job.salaryMax) && (
                <Badge>{formatSalaryRange(job.salaryMin, job.salaryMax)}</Badge>
              )}
            </div>

            <div className="mt-8 rounded-lg border border-border bg-surface p-6">
              {status === "authenticated" && user?.role === "CANDIDATE" && <ApplySection jobId={job.id} />}
              {status === "unauthenticated" && (
                <Link href="/login">
                  <Button className="w-full sm:w-auto">Log in to apply</Button>
                </Link>
              )}
              {status === "authenticated" && user?.role !== "CANDIDATE" && (
                <p className="text-sm text-muted">
                  You&apos;re viewing this listing as a {user?.role.toLowerCase()}.
                </p>
              )}
            </div>

            <section className="mt-8">
              <h2 className="text-sm font-semibold text-foreground">About this role</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{job.description}</p>
            </section>

            {job.requiredSkills.length > 0 && (
              <section className="mt-8">
                <h2 className="text-sm font-semibold text-foreground">Required skills</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((skill) => (
                    <Badge key={skill} variant="brand">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {job.preferredSkills.length > 0 && (
              <section className="mt-6">
                <h2 className="text-sm font-semibold text-foreground">Preferred skills</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {job.preferredSkills.map((skill) => (
                    <Badge key={skill}>{skill}</Badge>
                  ))}
                </div>
              </section>
            )}

            {job.education.length > 0 && (
              <section className="mt-6">
                <h2 className="text-sm font-semibold text-foreground">Education</h2>
                <ul className="mt-2 list-inside list-disc text-sm text-muted">
                  {job.education.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {job.deadline && (
              <p className="mt-8 text-xs text-muted">Applications close {formatDate(job.deadline)}</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
