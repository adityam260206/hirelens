import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { paginate } from "../../utils/pagination";
import type { ListCandidatesQuery, UpdateCandidateProfileInput } from "./candidates.schemas";

function computeProfileCompletion(candidate: {
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: string[];
  education: unknown;
  experience: unknown;
}) {
  const checks = [
    Boolean(candidate.phone),
    Boolean(candidate.location),
    Boolean(candidate.summary),
    candidate.skills.length > 0,
    Array.isArray(candidate.education) && candidate.education.length > 0,
    Array.isArray(candidate.experience) && candidate.experience.length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export async function getOwnProfile(userId: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { userId },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });
  if (!candidate) throw ApiError.notFound("Candidate profile not found");
  return candidate;
}

export async function updateOwnProfile(userId: string, input: UpdateCandidateProfileInput) {
  const existing = await prisma.candidate.findUnique({ where: { userId } });
  if (!existing) throw ApiError.notFound("Candidate profile not found");

  const profileCompletion = computeProfileCompletion({
    phone: input.phone !== undefined ? input.phone : existing.phone,
    location: input.location !== undefined ? input.location : existing.location,
    summary: input.summary !== undefined ? input.summary : existing.summary,
    skills: input.skills !== undefined ? input.skills : existing.skills,
    education: input.education !== undefined ? input.education : existing.education,
    experience: input.experience !== undefined ? input.experience : existing.experience,
  });

  return prisma.candidate.update({
    where: { userId },
    data: {
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.summary !== undefined ? { summary: input.summary } : {}),
      ...(input.skills !== undefined ? { skills: input.skills } : {}),
      ...(input.education !== undefined ? { education: input.education as Prisma.InputJsonValue } : {}),
      ...(input.experience !== undefined ? { experience: input.experience as Prisma.InputJsonValue } : {}),
      ...(input.projects !== undefined ? { projects: input.projects as Prisma.InputJsonValue } : {}),
      ...(input.certifications !== undefined
        ? { certifications: input.certifications as Prisma.InputJsonValue }
        : {}),
      ...(input.languages !== undefined ? { languages: input.languages } : {}),
      profileCompletion,
    },
  });
}

// Recruiters only ever see candidates who have applied to one of their
// company's jobs — not a global directory of every candidate in the system.
export async function listCandidatesForCompany(companyId: string, query: ListCandidatesQuery) {
  const where: Prisma.CandidateWhereInput = {
    applications: {
      some: {
        job: { companyId },
        ...(query.jobId ? { jobId: query.jobId } : {}),
      },
    },
    ...(query.search
      ? {
          user: {
            OR: [
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.candidate.count({ where }),
  ]);

  return paginate(items, total, query.page, query.pageSize);
}

export async function getCandidateForCompany(candidateId: string, companyId: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      applications: { where: { job: { companyId } }, select: { id: true, jobId: true, status: true } },
    },
  });

  if (!candidate || candidate.applications.length === 0) {
    // No application to this company means no relationship exists — treat as
    // not found rather than forbidden so we don't confirm the candidate exists.
    throw ApiError.notFound("Candidate not found");
  }

  return candidate;
}
