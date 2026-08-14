"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select, TextArea } from "@/components/ui/Field";
import { RatingInput } from "@/components/interviews/RatingInput";
import { ApiClientError } from "@/lib/api-client";
import { clientEnv } from "@/lib/env";
import { interviewsService } from "@/services/interviews.service";
import type { Interview, RecommendationLevel } from "@/types/interview";

const RECOMMENDATION_OPTIONS: { value: RecommendationLevel; label: string }[] = [
  { value: "STRONG_HIRE", label: "Strong Hire" },
  { value: "HIRE", label: "Hire" },
  { value: "NEUTRAL", label: "Neutral" },
  { value: "NO_HIRE", label: "No Hire" },
  { value: "STRONG_NO_HIRE", label: "Strong No Hire" },
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InterviewDetailPage() {
  return (
    <RequireRole roles={["INTERVIEWER"]}>
      <DashboardShell>
        <InterviewDetail />
      </DashboardShell>
    </RequireRole>
  );
}

function InterviewDetail() {
  const params = useParams<{ id: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    interviewsService
      .get(params.id)
      .then(setInterview)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load this interview."));
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <Alert>{error}</Alert>;
  if (!interview) return <FullScreenLoading />;

  const candidate = interview.application.candidate.user;

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {candidate.firstName} {candidate.lastName}
          </h1>
          <p className="mt-1 text-sm text-muted">{candidate.email}</p>
          <p className="mt-1 text-sm text-muted">
            {interview.type.charAt(0) + interview.type.slice(1).toLowerCase()} interview for{" "}
            <span className="text-foreground">{interview.application.job.title}</span>
          </p>
        </div>
        <Badge
          variant={
            interview.status === "SCHEDULED" ? "brand" : interview.status === "COMPLETED" ? "success" : "danger"
          }
        >
          {interview.status}
        </Badge>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">
        <p>
          <span className="text-muted">When: </span>
          {formatDateTime(interview.scheduledAt)} ({interview.durationMinutes} min)
        </p>
        {interview.meetingLink && (
          <p className="mt-1">
            <span className="text-muted">Meeting: </span>
            <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="text-brand hover:underline">
              {interview.meetingLink}
            </a>
          </p>
        )}
        <p className="mt-1">
          <a
            href={`${clientEnv.apiUrl}/resumes/${interview.application.resumeId}/file`}
            target="_blank"
            rel="noreferrer"
            className="text-brand hover:underline"
          >
            View candidate resume
          </a>
        </p>
      </div>

      <div className="mt-8">
        {interview.feedback ? (
          <FeedbackSummaryView feedback={interview.feedback} />
        ) : interview.status === "CANCELLED" ? (
          <p className="text-sm text-muted">This interview was cancelled — no feedback needed.</p>
        ) : (
          <FeedbackForm interviewId={interview.id} onSubmitted={load} />
        )}
      </div>
    </div>
  );
}

function FeedbackSummaryView({ feedback }: { feedback: NonNullable<Interview["feedback"]> }) {
  const categories = [
    { label: "Technical", rating: feedback.technicalRating, comment: feedback.technicalComment },
    { label: "Communication", rating: feedback.communicationRating, comment: feedback.communicationComment },
    { label: "Problem solving", rating: feedback.problemSolvingRating, comment: feedback.problemSolvingComment },
    { label: "Teamwork", rating: feedback.teamworkRating, comment: feedback.teamworkComment },
    { label: "Leadership", rating: feedback.leadershipRating, comment: feedback.leadershipComment },
  ].filter((c) => c.rating !== null || c.comment);

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Your feedback</h2>
        <Badge variant="brand">{feedback.overallRecommendation.replace(/_/g, " ")}</Badge>
      </div>
      {feedback.aiSummary && <p className="mt-2 text-sm text-muted">{feedback.aiSummary}</p>}
      <div className="mt-4 space-y-2">
        {categories.map((c) => (
          <div key={c.label} className="text-sm">
            <span className="font-medium text-foreground">{c.label}</span>
            {c.rating !== null && <span className="text-muted"> — {c.rating}/5</span>}
            {c.comment && <p className="text-muted">{c.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackForm({ interviewId, onSubmitted }: { interviewId: string; onSubmitted: () => void }) {
  const [technicalRating, setTechnicalRating] = useState<number>();
  const [technicalComment, setTechnicalComment] = useState("");
  const [communicationRating, setCommunicationRating] = useState<number>();
  const [communicationComment, setCommunicationComment] = useState("");
  const [problemSolvingRating, setProblemSolvingRating] = useState<number>();
  const [problemSolvingComment, setProblemSolvingComment] = useState("");
  const [teamworkRating, setTeamworkRating] = useState<number>();
  const [teamworkComment, setTeamworkComment] = useState("");
  const [leadershipRating, setLeadershipRating] = useState<number>();
  const [leadershipComment, setLeadershipComment] = useState("");
  const [overallRecommendation, setOverallRecommendation] = useState<RecommendationLevel>("HIRE");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await interviewsService.submitFeedback(interviewId, {
        technicalRating,
        technicalComment: technicalComment || undefined,
        communicationRating,
        communicationComment: communicationComment || undefined,
        problemSolvingRating,
        problemSolvingComment: problemSolvingComment || undefined,
        teamworkRating,
        teamworkComment: teamworkComment || undefined,
        leadershipRating,
        leadershipComment: leadershipComment || undefined,
        overallRecommendation,
        summary: summary || undefined,
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">Submit feedback</h2>
      {error && <Alert>{error}</Alert>}

      <RatingInput label="Technical" value={technicalRating} onChange={setTechnicalRating} />
      <TextArea label="Technical notes" rows={2} value={technicalComment} onChange={(e) => setTechnicalComment(e.target.value)} />

      <RatingInput label="Communication" value={communicationRating} onChange={setCommunicationRating} />
      <TextArea label="Communication notes" rows={2} value={communicationComment} onChange={(e) => setCommunicationComment(e.target.value)} />

      <RatingInput label="Problem solving" value={problemSolvingRating} onChange={setProblemSolvingRating} />
      <TextArea label="Problem solving notes" rows={2} value={problemSolvingComment} onChange={(e) => setProblemSolvingComment(e.target.value)} />

      <RatingInput label="Teamwork" value={teamworkRating} onChange={setTeamworkRating} />
      <TextArea label="Teamwork notes" rows={2} value={teamworkComment} onChange={(e) => setTeamworkComment(e.target.value)} />

      <RatingInput label="Leadership" value={leadershipRating} onChange={setLeadershipRating} />
      <TextArea label="Leadership notes" rows={2} value={leadershipComment} onChange={(e) => setLeadershipComment(e.target.value)} />

      <Select
        label="Overall recommendation"
        value={overallRecommendation}
        onChange={(e) => setOverallRecommendation(e.target.value as RecommendationLevel)}
        options={RECOMMENDATION_OPTIONS}
      />
      <TextArea label="Summary" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />

      <Button type="submit" loading={submitting} className="w-full sm:w-auto">
        Submit feedback
      </Button>
    </form>
  );
}
