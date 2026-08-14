import type { ParsedResumeData } from "../schemas";

// Every function here is pure and deterministic — no AI calls. The overall
// match score comes entirely from this module; the AI layer only adds an
// optional plain-English narrative on top (see matching.service.ts), never
// touches the numbers.

function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase();
}

export function buildCandidateSkillSet(resumeSkills: string[], profileSkills: string[]): Set<string> {
  return new Set([...resumeSkills, ...profileSkills].map(normalizeSkill));
}

function matchSkills(required: string[], candidateSkills: Set<string>) {
  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of required) {
    if (candidateSkills.has(normalizeSkill(skill))) matched.push(skill);
    else missing.push(skill);
  }
  return { matched, missing };
}

function parseYear(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const match = dateStr.match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

export function estimateYearsOfExperience(experience: ParsedResumeData["experience"]): number {
  const currentYear = new Date().getFullYear();
  let totalMonths = 0;

  for (const entry of experience) {
    const startYear = parseYear(entry.startDate);
    if (startYear === null) continue;
    const endYear = entry.isCurrent || !entry.endDate ? currentYear : (parseYear(entry.endDate) ?? currentYear);
    totalMonths += Math.max(0, endYear - startYear) * 12;
  }

  return Math.round((totalMonths / 12) * 10) / 10;
}

export function scoreTechnicalSkills(requiredSkills: string[], preferredSkills: string[], candidateSkills: Set<string>) {
  const required = matchSkills(requiredSkills, candidateSkills);
  const preferred = matchSkills(preferredSkills, candidateSkills);

  const requiredRatio = requiredSkills.length > 0 ? required.matched.length / requiredSkills.length : 1;
  const preferredRatio = preferredSkills.length > 0 ? preferred.matched.length / preferredSkills.length : null;

  // Required skills carry the weight; preferred skills only add a bonus on
  // top when the job actually lists any.
  const score =
    preferredRatio === null ? Math.round(requiredRatio * 100) : Math.round(requiredRatio * 80 + preferredRatio * 20);

  return { score, required, preferred };
}

export function scoreExperience(minExperience: number, resumeExperience: ParsedResumeData["experience"]) {
  const years = estimateYearsOfExperience(resumeExperience);
  const ratio = minExperience > 0 ? Math.min(years / minExperience, 1) : years > 0 ? 1 : 0.7;
  return { score: Math.round(ratio * 100), years };
}

export function scoreProjects(requiredSkills: string[], preferredSkills: string[], projects: ParsedResumeData["projects"]) {
  if (projects.length === 0) {
    // No project section isn't disqualifying (common for senior candidates
    // who list work history instead) — a neutral partial score, not zero.
    return { score: 40, coveredSkills: [] as string[] };
  }

  const relevantPool = new Set([...requiredSkills, ...preferredSkills].map(normalizeSkill));
  const covered = new Set<string>();
  for (const project of projects) {
    for (const tech of project.technologies) {
      const normalized = normalizeSkill(tech);
      if (relevantPool.has(normalized)) covered.add(normalized);
    }
  }

  const ratio = relevantPool.size > 0 ? covered.size / relevantPool.size : 0.6;
  const baseCreditForHavingProjects = 20;
  const score = Math.min(100, Math.round(baseCreditForHavingProjects + ratio * 80));
  return { score, coveredSkills: Array.from(covered) };
}

export function scoreEducation(jobEducation: string[], candidateEducation: ParsedResumeData["education"]) {
  if (jobEducation.length === 0) return { score: 100 };
  if (candidateEducation.length === 0) return { score: 30 };

  const jobKeywords = jobEducation.map((e) => e.toLowerCase());
  const hasMatch = candidateEducation.some((edu) => {
    const text = `${edu.degree} ${edu.fieldOfStudy ?? ""}`.toLowerCase();
    return jobKeywords.some((kw) => kw.split(/\s+/).some((word) => word.length > 3 && text.includes(word)));
  });

  return { score: hasMatch ? 100 : 55 };
}

export function scoreRoleAlignment(jobTitle: string, experience: ParsedResumeData["experience"]) {
  if (experience.length === 0) return { score: 20 };

  const jobWords = new Set(jobTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  let bestOverlap = 0;
  for (const entry of experience) {
    const titleWords = new Set(entry.title.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
    const overlap = [...jobWords].filter((w) => titleWords.has(w)).length;
    const ratio = jobWords.size > 0 ? overlap / jobWords.size : 0;
    bestOverlap = Math.max(bestOverlap, ratio);
  }

  // A floor of 40 since any professional experience is worth something even
  // with a title that doesn't textually overlap the job title.
  return { score: Math.min(100, Math.round(40 + bestOverlap * 60)) };
}
