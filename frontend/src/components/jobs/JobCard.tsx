import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatEmploymentType, formatExperienceRange, formatSalaryRange, formatWorkMode } from "@/lib/format";
import type { JobCard as JobCardType } from "@/types/job";

export function JobCard({ job, href }: { job: JobCardType; href: string }) {
  const salary = formatSalaryRange(job.salaryMin, job.salaryMax);
  const extraSkills = job.requiredSkills.length - 4;

  return (
    <Link
      href={href}
      className="block rounded-lg border border-border bg-surface p-5 transition-colors hover:border-brand/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted">{job.company.name}</p>
          <h3 className="mt-0.5 text-base font-semibold text-foreground">{job.title}</h3>
        </div>
        <Badge variant="brand">{formatWorkMode(job.workMode)}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        {job.location && <span>{job.location}</span>}
        <span>{formatEmploymentType(job.employmentType)}</span>
        <span>{formatExperienceRange(job.minExperience, job.maxExperience)}</span>
        {salary && <span>{salary}</span>}
      </div>

      {job.requiredSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.requiredSkills.slice(0, 4).map((skill) => (
            <Badge key={skill}>{skill}</Badge>
          ))}
          {extraSkills > 0 && <Badge>+{extraSkills} more</Badge>}
        </div>
      )}
    </Link>
  );
}
