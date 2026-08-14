export type SkillEvidenceStatus = "matched" | "not_found";

export type SkillEvidence = {
  skill: string;
  requirementType: "required" | "preferred";
  status: SkillEvidenceStatus;
  evidence: string;
};

export type MatchScoreBreakdown = {
  overallScore: number;
  technicalScore: number;
  experienceScore: number;
  projectScore: number;
  educationScore: number;
  roleAlignmentScore: number;
};

export type MatchConfidence = "low" | "medium" | "high";

export type MatchResult = MatchScoreBreakdown & {
  strengths: string[];
  skillGaps: string[];
  weakEvidence: string[];
  evidence: SkillEvidence[];
  recommendation: string;
  confidence: MatchConfidence;
};

export type MatchJobInput = {
  title: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minExperience: number;
  education: string[];
};
