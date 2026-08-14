"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ApiClientError } from "@/lib/api-client";
import { applicationsService } from "@/services/applications.service";
import type { ApplicationDetail, ApplicationStatus } from "@/types/application";

const STATUS_FLOW: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "TECHNICAL_INTERVIEW",
  "HR_INTERVIEW",
  "OFFER",
  "HIRED",
];

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  SHORTLISTED: "Shortlisted",
  TECHNICAL_INTERVIEW: "Technical interview",
  HR_INTERVIEW: "HR interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

function nextStatus(current: ApplicationStatus): ApplicationStatus | null {
  const index = STATUS_FLOW.indexOf(current);
  if (index === -1 || index === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[index + 1];
}

export function JobApplicationsSection({ jobId }: { jobId: string }) {
  const [applications, setApplications] = useState<ApplicationDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    applicationsService
      .listForJob(jobId)
      .then((result) => setApplications(result.items))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load applications."));
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  async function moveForward(application: ApplicationDetail) {
    const next = nextStatus(application.status);
    if (!next) return;
    setActionError(null);
    setBusyId(application.id);
    try {
      await applicationsService.updateStatus(application.id, next);
      load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Could not update this application.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(application: ApplicationDetail) {
    setActionError(null);
    setBusyId(application.id);
    try {
      await applicationsService.updateStatus(application.id, "REJECTED");
      load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Could not update this application.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold text-foreground">Applications</h2>
      {error && (
        <div className="mt-2">
          <Alert>{error}</Alert>
        </div>
      )}
      {actionError && (
        <div className="mt-2">
          <Alert>{actionError}</Alert>
        </div>
      )}
      {!error && applications === null && <p className="mt-2 text-sm text-muted">Loading…</p>}
      {applications !== null && applications.length === 0 && (
        <p className="mt-2 text-sm text-muted">No one has applied yet.</p>
      )}
      {applications !== null && applications.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {applications.map((application) => {
            const next = nextStatus(application.status);
            const isTerminal = application.status === "HIRED" || application.status === "REJECTED";
            return (
              <div
                key={application.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
              >
                <div>
                  <Link
                    href={`/recruiter/applications/${application.id}`}
                    className="text-sm font-medium text-foreground hover:text-brand hover:underline"
                  >
                    {application.candidate.user.firstName} {application.candidate.user.lastName}
                  </Link>
                  <p className="text-xs text-muted">{application.candidate.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {application.match && (
                    <Badge variant={application.match.overallScore >= 70 ? "success" : "warning"}>
                      {application.match.overallScore}% match
                    </Badge>
                  )}
                  <Badge variant={application.status === "REJECTED" ? "danger" : "brand"}>
                    {STATUS_LABEL[application.status]}
                  </Badge>
                  {!isTerminal && (
                    <>
                      {next && (
                        <button
                          type="button"
                          disabled={busyId === application.id}
                          onClick={() => moveForward(application)}
                          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-background disabled:opacity-50"
                        >
                          Move to {STATUS_LABEL[next]}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === application.id}
                        onClick={() => reject(application)}
                        className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger-muted disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
