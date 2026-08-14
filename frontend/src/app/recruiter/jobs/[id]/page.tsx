"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { Alert } from "@/components/ui/Alert";
import { Badge, JobStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { JobForm } from "@/components/jobs/JobForm";
import { JobApplicationsSection } from "@/components/jobs/JobApplicationsSection";
import { ApiClientError } from "@/lib/api-client";
import { formatEmploymentType, formatExperienceRange, formatWorkMode } from "@/lib/format";
import { jobsService } from "@/services/jobs.service";
import type { JobDetail } from "@/types/job";

export default function RecruiterJobDetailPage() {
  return (
    <RequireRole roles={["RECRUITER"]}>
      <DashboardShell>
        <RecruiterJobDetail />
      </DashboardShell>
    </RequireRole>
  );
}

function RecruiterJobDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    jobsService
      .get(params.id)
      .then(setJob)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load this job."));
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePublish() {
    setActionError(null);
    setActionLoading(true);
    try {
      await jobsService.publish(params.id);
      load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Could not publish this job.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClose() {
    setActionError(null);
    setActionLoading(true);
    try {
      await jobsService.close(params.id);
      load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Could not close this job.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    setActionError(null);
    setActionLoading(true);
    try {
      await jobsService.remove(params.id);
      router.push("/recruiter/jobs");
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Could not delete this job.");
      setActionLoading(false);
    }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!job) return <FullScreenLoading />;

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{job.title}</h1>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {formatWorkMode(job.workMode)} · {formatEmploymentType(job.employmentType)} ·{" "}
            {formatExperienceRange(job.minExperience, job.maxExperience)} · {job._count.applications} applications
          </p>
        </div>
      </div>

      {actionError && (
        <div className="mt-4">
          <Alert>{actionError}</Alert>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {job.status === "DRAFT" && (
          <Button onClick={handlePublish} loading={actionLoading}>
            Publish
          </Button>
        )}
        {job.status === "PUBLISHED" && (
          <Button variant="secondary" onClick={handleClose} loading={actionLoading}>
            Close job
          </Button>
        )}
        {job.status !== "CLOSED" && (
          <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
            {editing ? "Cancel edit" : "Edit"}
          </Button>
        )}
        {job.status === "DRAFT" && job._count.applications === 0 && (
          <Button variant="danger" onClick={handleDelete} loading={actionLoading}>
            Delete draft
          </Button>
        )}
        {job._count.applications > 0 && (
          <Link href={`/recruiter/jobs/${job.id}/pipeline`}>
            <Button variant="secondary">View pipeline</Button>
          </Link>
        )}
      </div>

      {editing ? (
        <div className="mt-8">
          <JobForm
            submitLabel="Save changes"
            initialValues={{
              title: job.title,
              department: job.department ?? "",
              description: job.description,
              location: job.location ?? "",
              workMode: job.workMode,
              employmentType: job.employmentType,
              minExperience: String(job.minExperience),
              maxExperience: job.maxExperience ? String(job.maxExperience) : "",
              salaryMin: job.salaryMin ? String(job.salaryMin) : "",
              salaryMax: job.salaryMax ? String(job.salaryMax) : "",
              requiredSkills: job.requiredSkills,
              preferredSkills: job.preferredSkills,
              education: job.education,
            }}
            onSubmit={async (payload) => {
              await jobsService.update(params.id, payload);
              setEditing(false);
              load();
            }}
          />
        </div>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-foreground">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{job.description}</p>
          </section>

          {job.requiredSkills.length > 0 && (
            <section className="mt-6">
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

          <JobApplicationsSection jobId={params.id} />
        </>
      )}
    </div>
  );
}
