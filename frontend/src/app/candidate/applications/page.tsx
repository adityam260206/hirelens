"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ApiClientError } from "@/lib/api-client";
import { applicationsService } from "@/services/applications.service";
import { offersService } from "@/services/offers.service";
import type { ApplicationDetail } from "@/types/application";

const STATUS_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  SHORTLISTED: "Shortlisted",
  TECHNICAL_INTERVIEW: "Technical interview",
  HR_INTERVIEW: "HR interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Not moving forward",
};

export default function CandidateApplicationsPage() {
  return (
    <RequireRole roles={["CANDIDATE"]}>
      <DashboardShell>
        <ApplicationsList />
      </DashboardShell>
    </RequireRole>
  );
}

function ApplicationsList() {
  const [applications, setApplications] = useState<ApplicationDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    applicationsService
      .listMine()
      .then((result) => setApplications(result.items))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load your applications."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function respondToOffer(offerId: string, action: "accept" | "reject") {
    setActionError(null);
    setBusyId(offerId);
    try {
      if (action === "accept") await offersService.accept(offerId);
      else await offersService.reject(offerId);
      load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Could not respond to this offer.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Your applications</h1>
      <p className="mt-1 text-sm text-muted">Track where each application stands.</p>

      <div className="mt-8">
        {error && <Alert>{error}</Alert>}
        {actionError && (
          <div className="mb-4">
            <Alert>{actionError}</Alert>
          </div>
        )}
        {!error && applications === null && <FullScreenLoading />}
        {applications !== null && applications.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
            You haven&apos;t applied to any jobs yet.{" "}
            <Link href="/jobs" className="font-medium text-brand hover:underline">
              Browse open roles
            </Link>
            .
          </div>
        )}
        {applications !== null && applications.length > 0 && (
          <div className="flex flex-col gap-3">
            {applications.map((application) => (
              <div key={application.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <Link href={`/jobs/${application.jobId}`} className="hover:text-brand">
                    <p className="text-sm font-medium text-foreground">{application.job.title}</p>
                    <p className="text-xs text-muted">{application.job.company.name}</p>
                  </Link>
                  <Badge variant={application.status === "REJECTED" ? "danger" : "brand"}>
                    {STATUS_LABEL[application.status] ?? application.status}
                  </Badge>
                </div>

                {application.offer && application.offer.status === "SENT" && (
                  <div className="mt-3 rounded-md border border-brand/30 bg-brand-muted p-3">
                    <p className="text-sm font-medium text-foreground">
                      Offer: {application.offer.position} — {application.offer.currency}{" "}
                      {application.offer.salary.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted">
                      Starts {new Date(application.offer.joiningDate).toLocaleDateString()}
                      {application.offer.location ? ` · ${application.offer.location}` : ""}
                    </p>
                    {application.offer.benefits.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {application.offer.benefits.map((b) => (
                          <Badge key={b}>{b}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        loading={busyId === application.offer.id}
                        onClick={() => respondToOffer(application.offer!.id, "accept")}
                      >
                        Accept offer
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={busyId === application.offer.id}
                        onClick={() => respondToOffer(application.offer!.id, "reject")}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )}

                {application.offer && application.offer.status === "ACCEPTED" && (
                  <p className="mt-3 text-sm font-medium text-success">
                    You accepted this offer — congratulations!
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
