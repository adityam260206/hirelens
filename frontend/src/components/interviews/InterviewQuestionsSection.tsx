"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ApiClientError } from "@/lib/api-client";
import { matchingService } from "@/services/matching.service";
import type { InterviewQuestion, QuestionDifficulty } from "@/types/interviewQuestion";

const DIFFICULTY_VARIANT: Record<QuestionDifficulty, "success" | "warning" | "danger"> = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
};

export function InterviewQuestionsSection({ applicationId }: { applicationId: string }) {
  const [questions, setQuestions] = useState<InterviewQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      const result = await matchingService.interviewQuestions(applicationId);
      setQuestions(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not generate interview questions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Interview questions</h2>
        <Button size="sm" variant="secondary" loading={loading} onClick={generate}>
          {questions ? "Regenerate" : "Generate questions"}
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted">
        AI-suggested, grounded in this job&apos;s requirements and the candidate&apos;s skill gaps —
        review before use.
      </p>

      {error && (
        <div className="mt-2">
          <Alert>{error}</Alert>
        </div>
      )}

      {questions && questions.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {questions.map((q, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-3">
              <p className="text-sm text-foreground">{q.question}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge>{q.category}</Badge>
                <Badge variant={DIFFICULTY_VARIANT[q.difficulty]}>{q.difficulty}</Badge>
                {q.relatedSkill && <Badge variant="brand">{q.relatedSkill}</Badge>}
              </div>
              <p className="mt-1.5 text-xs text-muted">{q.reason}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
