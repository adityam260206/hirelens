import { ScoreBar } from "./ScoreBar";
import { ScoreRing } from "./ScoreRing";
import type { CandidateMatch } from "@/types/match";

const CONFIDENCE_LABEL: Record<string, string> = {
  low: "Low confidence — limited resume data available",
  medium: "Medium confidence",
  high: "High confidence",
};

export function MatchPanel({ match }: { match: CandidateMatch }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={match.overallScore} />
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Match</p>
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-brand">Evidence-based candidate analysis</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{match.recommendation}</p>
          {match.aiNarrative && <p className="mt-2 text-sm text-muted">{match.aiNarrative}</p>}
          <p className="mt-3 text-xs text-muted">{CONFIDENCE_LABEL[match.confidence] ?? match.confidence}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <ScoreBar label="Technical skills" score={match.technicalScore} />
        <ScoreBar label="Experience" score={match.experienceScore} />
        <ScoreBar label="Projects" score={match.projectScore} />
        <ScoreBar label="Education" score={match.educationScore} />
        <ScoreBar label="Role alignment" score={match.roleAlignmentScore} />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Why this candidate matches</h3>
          {match.strengths.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {match.strengths.map((skill) => (
                <li key={skill} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="text-success">✓</span> {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No clear strengths identified from the available data.</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Potential gaps</h3>
          {match.skillGaps.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {match.skillGaps.map((skill) => (
                <li key={skill} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="text-warning">△</span> {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No required-skill gaps identified.</p>
          )}
          {match.weakEvidence.length > 0 && (
            <p className="mt-2 text-xs text-muted">
              Preferred but unconfirmed: {match.weakEvidence.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-foreground">Evidence</h3>
        <div className="mt-2 divide-y divide-border rounded-md border border-border">
          {match.evidence.map((item) => (
            <div key={`${item.requirementType}-${item.skill}`} className="flex items-start justify-between gap-4 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {item.skill}{" "}
                  <span className="font-normal text-muted">
                    ({item.requirementType === "required" ? "required" : "preferred"})
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted">{item.evidence}</p>
              </div>
              <span className={item.status === "matched" ? "text-success" : "text-warning"}>
                {item.status === "matched" ? "✓" : "△"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-md border border-border bg-background p-3 text-xs text-muted">
        This score is AI-generated decision support based on structured resume evidence — not a
        guarantee of job performance. <span className="font-medium text-foreground">Human decision required.</span>{" "}
        Recruiters remain responsible for hiring decisions.
      </div>
    </div>
  );
}
