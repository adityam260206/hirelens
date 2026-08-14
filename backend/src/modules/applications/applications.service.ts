import type { ApplicationStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { paginate } from "../../utils/pagination";
import { logActivity } from "../../utils/activityLog";
import { analyzeApplicationSilently } from "../matching/matching.service";
import type { ListApplicationsQuery } from "./applications.schemas";

// A linear pipeline with REJECTED reachable from any active stage; HIRED and
// REJECTED are terminal. Enforced server-side — the client never decides
// what transition is legal.
const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  APPLIED: ["SCREENING", "REJECTED"],
  SCREENING: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["TECHNICAL_INTERVIEW", "REJECTED"],
  TECHNICAL_INTERVIEW: ["HR_INTERVIEW", "REJECTED"],
  HR_INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: [],
};

const APPLICATION_DETAIL_INCLUDE = {
  job: {
    select: {
      id: true,
      title: true,
      companyId: true,
      status: true,
      company: { select: { id: true, name: true } },
    },
  },
  resume: { select: { id: true, originalFilename: true, parseStatus: true } },
  candidate: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
  match: true,
  offer: true,
} satisfies Prisma.ApplicationInclude;

export async function applyToJob(candidateUserId: string, jobId: string, resumeId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { userId: candidateUserId } });
  if (!candidate) throw ApiError.notFound("Candidate profile not found");

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "PUBLISHED") throw ApiError.notFound("Job not found");

  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume || resume.candidateId !== candidate.id) {
    throw ApiError.badRequest("Select one of your uploaded resumes to apply with");
  }

  const existing = await prisma.application.findUnique({
    where: { candidateId_jobId: { candidateId: candidate.id, jobId } },
  });
  if (existing) throw ApiError.conflict("You have already applied to this job");

  const application = await prisma.application.create({
    data: { candidateId: candidate.id, jobId, resumeId },
  });

  // Analyze synchronously so the match is ready by the time this request
  // returns — fine at hackathon scale; a production build would move this to
  // a background queue (see docs/known-limitations).
  await analyzeApplicationSilently(application.id);

  return prisma.application.findUniqueOrThrow({
    where: { id: application.id },
    include: APPLICATION_DETAIL_INCLUDE,
  });
}

export async function listMyApplications(
  candidateUserId: string,
  query: { page: number; pageSize: number }
) {
  const candidate = await prisma.candidate.findUnique({ where: { userId: candidateUserId } });
  if (!candidate) throw ApiError.notFound("Candidate profile not found");

  const where: Prisma.ApplicationWhereInput = { candidateId: candidate.id };
  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: APPLICATION_DETAIL_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.application.count({ where }),
  ]);
  return paginate(items, total, query.page, query.pageSize);
}

export async function listApplicationsForCompany(companyId: string, query: ListApplicationsQuery) {
  const where: Prisma.ApplicationWhereInput = {
    job: { companyId },
    ...(query.jobId ? { jobId: query.jobId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: APPLICATION_DETAIL_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.application.count({ where }),
  ]);
  return paginate(items, total, query.page, query.pageSize);
}

async function getApplicationOr404(id: string) {
  const application = await prisma.application.findUnique({
    where: { id },
    include: APPLICATION_DETAIL_INCLUDE,
  });
  if (!application) throw ApiError.notFound("Application not found");
  return application;
}

export async function getApplicationForCompany(id: string, companyId: string) {
  const application = await getApplicationOr404(id);
  if (application.job.companyId !== companyId) throw ApiError.notFound("Application not found");
  return application;
}

export async function getApplicationForCandidate(id: string, candidateUserId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { userId: candidateUserId } });
  const application = await getApplicationOr404(id);
  if (!candidate || application.candidateId !== candidate.id) {
    throw ApiError.notFound("Application not found");
  }
  return application;
}

export async function updateApplicationStatus(
  id: string,
  companyId: string,
  nextStatus: ApplicationStatus,
  actorUserId: string
) {
  const application = await getApplicationOr404(id);
  if (application.job.companyId !== companyId) throw ApiError.notFound("Application not found");

  const allowed = ALLOWED_TRANSITIONS[application.status];
  if (!allowed.includes(nextStatus)) {
    throw ApiError.conflict(`Cannot move an application from ${application.status} to ${nextStatus}`);
  }

  const updated = await prisma.application.update({
    where: { id },
    data: { status: nextStatus },
    include: APPLICATION_DETAIL_INCLUDE,
  });

  await logActivity({
    userId: actorUserId,
    action: "APPLICATION_STATUS_CHANGED",
    entityType: "Application",
    entityId: id,
    metadata: { from: application.status, to: nextStatus },
  });

  return updated;
}
