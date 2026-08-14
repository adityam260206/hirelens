import type { ParsedResumeData } from "../schemas";
import {
  buildCandidateSkillSet,
  scoreEducation,
  scoreExperience,
  scoreProjects,
  scoreRoleAlignment,
  scoreTechnicalSkills,
} from "./scoring";
import type { MatchConfidence, MatchJobInput, MatchResult, SkillEvidence } from "./types";

// Weighted contribution of each component to the overall score. These are a
// reasonable starting point, not a universally validated formula — see
// HireLens docs. Keep in sync with the frontend copy that explains them.
export const MATCH_WEIGHTS = {
  technical: 0.35,
  experience: 0.25,
  projects: 0.2,
  education: 0.1,
  roleAlignment: 0.1,
} as const;

function buildSkillEvidence(
  matched: string[],
  missing: string[],
  requirementType: "required" | "preferred"
): SkillEvidence[] {
  return [
    ...matched.map((skill) => ({
      skill,
      requirementType,
      status: "matched" as const,
      evidence: `${skill} appears in the candidate's resume.`,
    })),
    ...missing.map((skill) => ({
      skill,
      requirementType,
      status: "not_found" as const,
      evidence: `No explicit evidence of ${skill} was identified in the available resume data.`,
    })),
  ];
}

function computeConfidence(resume: ParsedResumeData): MatchConfidence {
  const sectionsFilled = [
    resume.skills.length > 0,
    resume.experience.length > 0,
    resume.projects.length > 0,
    resume.education.length > 0,
  ].filter(Boolean).length;

  if (sectionsFilled >= 3) return "high";
  if (sectionsFilled === 2) return "medium";
  return "low";
}

function buildRecommendation(overallScore: number): string {
  if (overallScore >= 85) return "Strong candidate for technical interview";
  if (overallScore >= 70) return "Good candidate — consider for technical interview";
  if (overallScore >= 50) return "Potential candidate — review manually before proceeding";
  return "Limited alignment with job requirements — review manually";
}

export function computeMatch(input: { job: MatchJobInput; resume: ParsedResumeData; profileSkills: string[] }): MatchResult {
  const candidateSkillSet = buildCandidateSkillSet(input.resume.skills, input.profileSkills);

  const technical = scoreTechnicalSkills(input.job.requiredSkills, input.job.preferredSkills, candidateSkillSet);
  const experience = scoreExperience(input.job.minExperience, input.resume.experience);
  const projects = scoreProjects(input.job.requiredSkills, input.job.preferredSkills, input.resume.projects);
  const education = scoreEducation(input.job.education, input.resume.education);
  const roleAlignment = scoreRoleAlignment(input.job.title, input.resume.experience);

  const overallScore = Math.round(
    technical.score * MATCH_WEIGHTS.technical +
      experience.score * MATCH_WEIGHTS.experience +
      projects.score * MATCH_WEIGHTS.projects +
      education.score * MATCH_WEIGHTS.education +
      roleAlignment.score * MATCH_WEIGHTS.roleAlignment
  );

  const evidence = [
    ...buildSkillEvidence(technical.required.matched, technical.required.missing, "required"),
    ...buildSkillEvidence(technical.preferred.matched, technical.preferred.missing, "preferred"),
  ];

  return {
    overallScore,
    technicalScore: technical.score,
    experienceScore: experience.score,
    projectScore: projects.score,
    educationScore: education.score,
    roleAlignmentScore: roleAlignment.score,
    strengths: [...technical.required.matched, ...technical.preferred.matched],
    skillGaps: technical.required.missing,
    weakEvidence: technical.preferred.missing,
    evidence,
    recommendation: buildRecommendation(overallScore),
    confidence: computeConfidence(input.resume),
  };
}
