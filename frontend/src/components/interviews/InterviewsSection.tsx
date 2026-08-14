"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select, TextInput } from "@/components/ui/Field";
import { ApiClientError } from "@/lib/api-client";
import { interviewsService, teamService } from "@/services/interviews.service";
import type { Interview, InterviewType, Interviewer } from "@/types/interview";

const TYPE_OPTIONS: { value: InterviewType; label: string }[] = [
  { value: "TECHNICAL", label: "Technical" },
  { value: "HR", label: "HR" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "MANAGERIAL", label: "Managerial" },
  { value: "OTHER", label: "Other" },
];

const STATUS_VARIANT: Record<string, "neutral" | "brand" | "success" | "danger" | "warning"> = {
  SCHEDULED: "brand",
  COMPLETED: "success",
  CANCELLED: "danger",
  NO_SHOW: "warning",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InterviewsSection({ applicationId }: { applicationId: string }) {
  const [interviews, setInterviews] = useState<Interview[] | null>(null);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [interviewerId, setInterviewerId] = useState("");
  const [type, setType] = useState<InterviewType>("TECHNICAL");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [meetingLink, setMeetingLink] = useState("");

  const load = useCallback(() => {
    interviewsService
      .listMine(applicationId)
      .then((result) => setInterviews(result.items))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load interviews."));
  }, [applicationId]);

  useEffect(() => {
    load();
    teamService
      .listInterviewers()
      .then((list) => {
        setInterviewers(list);
        if (list.length > 0) setInterviewerId(list[0].id);
      })
      .catch(() => setInterviewers([]));
  }, [load]);

  async function handleSchedule(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!interviewerId) {
      setFormError("Add an interviewer under Team before scheduling.");
      return;
    }
    setSubmitting(true);
    try {
      await interviewsService.create({
        applicationId,
        interviewerId,
        type,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: Number(durationMinutes) || 45,
        meetingLink: meetingLink || undefined,
      });
      setShowForm(false);
      setScheduledAt("");
      setMeetingLink("");
      load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Could not schedule this interview.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(interviewId: string) {
    setBusyId(interviewId);
    try {
      await interviewsService.cancel(interviewId);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not cancel this interview.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Interviews</h2>
        <Button size="sm" variant="secondary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Schedule interview"}
        </Button>
      </div>

      {error && (
        <div className="mt-2">
          <Alert>{error}</Alert>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSchedule} className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          {formError && <Alert>{formError}</Alert>}
          {interviewers.length === 0 ? (
            <p className="text-sm text-muted">
              No interviewers yet — add one under{" "}
              <a href="/recruiter/team" className="text-brand hover:underline">
                Team
              </a>
              .
            </p>
          ) : (
            <>
              <Select
                label="Interviewer"
                value={interviewerId}
                onChange={(e) => setInterviewerId(e.target.value)}
                options={interviewers.map((i) => ({ value: i.id, label: `${i.firstName} ${i.lastName}` }))}
              />
              <Select
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value as InterviewType)}
                options={TYPE_OPTIONS}
              />
              <TextInput
                label="Date and time"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="Duration (minutes)"
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
                <TextInput
                  label="Meeting link"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <Button type="submit" loading={submitting} className="w-full sm:w-auto">
                Schedule
              </Button>
            </>
          )}
        </form>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {interviews === null && <p className="text-sm text-muted">Loading…</p>}
        {interviews !== null && interviews.length === 0 && (
          <p className="text-sm text-muted">No interviews scheduled yet.</p>
        )}
        {interviews?.map((interview) => (
          <div key={interview.id} className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {TYPE_OPTIONS.find((t) => t.value === interview.type)?.label} ·{" "}
                  {interview.interviewer.firstName} {interview.interviewer.lastName}
                </p>
                <p className="text-xs text-muted">{formatDateTime(interview.scheduledAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[interview.status] ?? "neutral"}>{interview.status}</Badge>
                {interview.status === "SCHEDULED" && (
                  <button
                    type="button"
                    disabled={busyId === interview.id}
                    onClick={() => handleCancel(interview.id)}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger-muted disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {interview.feedback && (
              <div className="mt-3 rounded-md border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">Feedback</p>
                  <Badge variant="brand">{interview.feedback.overallRecommendation.replace(/_/g, " ")}</Badge>
                </div>
                {interview.feedback.aiSummary && (
                  <p className="mt-1.5 text-xs text-muted">{interview.feedback.aiSummary}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
