"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MatchPanel } from "@/components/matching/MatchPanel";
import { InterviewsSection } from "@/components/interviews/InterviewsSection";
import { InterviewQuestionsSection } from "@/components/interviews/InterviewQuestionsSection";
import { OfferSection } from "@/components/offers/OfferSection";
import { ApiClientError } from "@/lib/api-client";
import { clientEnv } from "@/lib/env";
import { applicationsService } from "@/services/applications.service";
import { matchingService } from "@/services/matching.service";
import type { ApplicationDetail, ApplicationStatus } from "@/types/application";
import type { CandidateMatch } from "@/types/match";

const STATUS_FLOW: ApplicationStatus[] = [
  "APPLIED", "SCREENING", "SHORTLISTED", "TECHNICAL_INTERVIEW", "HR_INTERVIEW", "OFFER", "HIRED",
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

export default function ApplicationDetailPage() {
  return (
    <RequireRole roles={["RECRUITER"]}>
      <DashboardShell>
        <ApplicationDetailView />
      </DashboardShell>
    </RequireRole>
  );
}

function ApplicationDetailView() {
  const params = useParams<{ id: string }>();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [match, setMatch] = useState<CandidateMatch | null>(null);
  const [matchMissing, setMatchMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    applicationsService
      .get(params.id)
      .then(setApplication)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load this application."));

    matchingService
      .get(params.id)
      .then((m) => {
        setMatch(m);
        setMatchMissing(false);
      })
      .catch(() => setMatchMissing(true));
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function moveForward() {
    if (!application) return;
    const next = nextStatus(application.status);
    if (!next) return;
    setActionError(null);
    setBusy(true);
    try {
      await applicationsService.updateStatus(application.id, next);
      load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Could not update this application.");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!application) return;
    setActionError(null);
    setBusy(true);
    try {
      await applicationsService.updateStatus(application.id, "REJECTED");
      load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Could not update this application.");
    } finally {
      setBusy(false);
    }
  }

  async function runAnalysis() {
    setActionError(null);
    setBusy(true);
    try {
      const m = await matchingService.analyze(params.id);
      setMatch(m);
      setMatchMissing(false);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Could not analyze this application.");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!application) return <FullScreenLoading />;

  const next = nextStatus(application.status);
  const isTerminal = application.status === "HIRED" || application.status === "REJECTED";

  return (
    <div className="max-w-3xl">
      <Link href={`/recruiter/jobs/${application.jobId}`} className="text-sm text-brand hover:underline">
        ← Back to {application.job.title}
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {application.candidate.user.firstName} {application.candidate.user.lastName}
          </h1>
          <p className="mt-1 text-sm text-muted">{application.candidate.user.email}</p>
          <p className="mt-1 text-sm text-muted">
            Applying for <span className="text-foreground">{application.job.title}</span>
          </p>
        </div>
        <Badge variant={application.status === "REJECTED" ? "danger" : "brand"}>
          {STATUS_LABEL[application.status]}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={`${clientEnv.apiUrl}/resumes/${application.resumeId}/file`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface"
        >
          Download resume ({application.resume.originalFilename})
        </a>
        {!isTerminal && next && (
          <Button size="sm" onClick={moveForward} loading={busy}>
            Move to {STATUS_LABEL[next]}
          </Button>
        )}
        {!isTerminal && (
          <Button size="sm" variant="danger" onClick={reject} loading={busy}>
            Reject
          </Button>
        )}
      </div>

      {actionError && (
        <div className="mt-4">
          <Alert>{actionError}</Alert>
        </div>
      )}

      <div className="mt-8">
        {match && <MatchPanel match={match} />}
        {!match && matchMissing && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted">
              {application.resume.parseStatus === "COMPLETED"
                ? "This application hasn't been analyzed yet."
                : `Resume analysis is ${application.resume.parseStatus.toLowerCase()} — the match can be generated once it completes.`}
            </p>
            <Button
              className="mt-4"
              onClick={runAnalysis}
              loading={busy}
              disabled={application.resume.parseStatus !== "COMPLETED"}
            >
              Run match analysis
            </Button>
          </div>
        )}
        {!match && !matchMissing && <FullScreenLoading />}
      </div>

      <InterviewQuestionsSection applicationId={application.id} />

      <InterviewsSection applicationId={application.id} />

      <OfferSection
        applicationId={application.id}
        offer={application.offer}
        jobTitle={application.job.title}
        onChange={load}
      />
    </div>
  );
}
