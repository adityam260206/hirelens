import type { InterviewQuestion, ParsedResumeData } from "./schemas";

export type MatchSummaryInput = {
  jobTitle: string;
  overallScore: number;
  strengths: string[];
  skillGaps: string[];
  recommendation: string;
};

export type FeedbackSummaryInput = {
  candidateName: string;
  jobTitle: string;
  overallRecommendation: string;
  ratings: Array<{ category: string; rating: number | null; comment: string | null }>;
};

export type GenerateQuestionsInput = {
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  preferredSkills: string[];
  skillGaps: string[];
};

// A single abstraction over the LLM(s) HireLens uses, so the provider can be
// swapped (or mocked for offline dev) without touching calling code. Methods
// are added here as each AI-driven feature is built (matching, interview
// questions, feedback summaries, ...).
export interface AIProvider {
  readonly modelName: string;
  parseResume(resumeText: string): Promise<ParsedResumeData>;
  // Produces a short plain-English narrative strictly grounded in the given
  // facts — this never influences the deterministic score itself, which is
  // already final by the time this is called (see ai/matching/engine.ts).
  summarizeMatch(input: MatchSummaryInput): Promise<string>;
  // Synthesizes the interviewer's own ratings/comments into a short summary —
  // never introduces a claim or score the interviewer didn't give, and never
  // softens or overrides their stated recommendation.
  summarizeFeedback(input: FeedbackSummaryInput): Promise<string>;
  // The one place creative generation is appropriate — the others are
  // strictly grounded in given facts, but plausible, varied interview
  // questions are the actual deliverable here, not a restatement of input.
  generateInterviewQuestions(input: GenerateQuestionsInput): Promise<InterviewQuestion[]>;
}
