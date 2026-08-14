export type MatchConfidence = "low" | "medium" | "high";

export type SkillEvidence = {
  skill: string;
  requirementType: "required" | "preferred";
  status: "matched" | "not_found";
  evidence: string;
};

export type CandidateMatch = {
  id: string;
  applicationId: string;
  overallScore: number;
  technicalScore: number;
  experienceScore: number;
  projectScore: number;
  educationScore: number;
  roleAlignmentScore: number;
  strengths: string[];
  skillGaps: string[];
  weakEvidence: string[];
  evidence: SkillEvidence[];
  recommendation: string;
  confidence: MatchConfidence;
  aiNarrative: string | null;
  aiModel: string | null;
  aiVersion: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  errorMessage: string | null;
  analyzedAt: string;
};
