import type { EmploymentType, WorkMode } from "@/types/job";

const workModeLabel: Record<WorkMode, string> = {
  REMOTE: "Remote",
  ONSITE: "On-site",
  HYBRID: "Hybrid",
};

const employmentTypeLabel: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

export function formatWorkMode(mode: WorkMode) {
  return workModeLabel[mode];
}

export function formatEmploymentType(type: EmploymentType) {
  return employmentTypeLabel[type];
}

export function formatExperienceRange(min: number, max: number | null) {
  if (min === 0 && !max) return "Any experience";
  if (max) return `${min}–${max} yrs`;
  return `${min}+ yrs`;
}

export function formatSalaryRange(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

export function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
