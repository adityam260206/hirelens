import type { ApplicationStatus } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";

const FUNNEL_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "TECHNICAL_INTERVIEW",
  "HR_INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

// Applications currently at or past the shortlisted stage in the active
// (non-rejected) pipeline — a defensible "shortlisted" snapshot without
// needing to replay ActivityLog history.
const SHORTLISTED_OR_LATER: ApplicationStatus[] = [
  "SHORTLISTED",
  "TECHNICAL_INTERVIEW",
  "HR_INTERVIEW",
  "OFFER",
  "HIRED",
];

async function buildFunnel(where: { companyId?: string; jobId?: string }) {
  const applicationWhere = where.jobId ? { jobId: where.jobId } : { job: { companyId: where.companyId } };

  const counts = await prisma.application.groupBy({
    by: ["status"],
    where: applicationWhere,
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.status, c._count._all]));

  return FUNNEL_STATUSES.map((status) => ({ status, count: countMap.get(status) ?? 0 }));
}

export async function getOverview(companyId: string) {
  const applicationWhere = { job: { companyId } };

  const [totalApplications, activeJobs, candidatesShortlisted, interviews, offersCreated, hires, offersSent, offersAccepted] =
    await Promise.all([
      prisma.application.count({ where: applicationWhere }),
      prisma.job.count({ where: { companyId, status: "PUBLISHED" } }),
      prisma.application.count({ where: { ...applicationWhere, status: { in: SHORTLISTED_OR_LATER } } }),
      prisma.interview.count({ where: { application: applicationWhere } }),
      prisma.offerLetter.count({ where: { application: applicationWhere } }),
      prisma.application.count({ where: { ...applicationWhere, status: "HIRED" } }),
      prisma.offerLetter.count({
        where: { application: applicationWhere, status: { in: ["SENT", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"] } },
      }),
      prisma.offerLetter.count({ where: { application: applicationWhere, status: "ACCEPTED" } }),
    ]);

  const offerAcceptanceRate = offersSent > 0 ? Math.round((offersAccepted / offersSent) * 1000) / 10 : null;

  const hiredApplications = await prisma.application.findMany({
    where: { ...applicationWhere, status: "HIRED" },
    select: { createdAt: true, updatedAt: true },
  });
  const avgTimeToHireDays =
    hiredApplications.length > 0
      ? Math.round(
          (hiredApplications.reduce((sum, a) => sum + (a.updatedAt.getTime() - a.createdAt.getTime()), 0) /
            hiredApplications.length /
            (1000 * 60 * 60 * 24)) *
            10
        ) / 10
      : null;

  return {
    totalApplications,
    activeJobs,
    candidatesShortlisted,
    interviews,
    offers: offersCreated,
    hires,
    offerAcceptanceRate,
    avgTimeToHireDays,
  };
}

export async function getFunnel(companyId: string) {
  return buildFunnel({ companyId });
}

export async function getJobAnalytics(jobId: string, companyId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.companyId !== companyId) throw ApiError.notFound("Job not found");

  const funnel = await buildFunnel({ jobId });
  const totalApplications = funnel.reduce((sum, f) => sum + f.count, 0);

  const matches = await prisma.candidateMatch.findMany({
    where: { application: { jobId } },
    select: { overallScore: true },
  });
  const avgMatchScore =
    matches.length > 0 ? Math.round(matches.reduce((sum, m) => sum + m.overallScore, 0) / matches.length) : null;

  return {
    jobId,
    title: job.title,
    status: job.status,
    funnel,
    totalApplications,
    avgMatchScore,
  };
}
