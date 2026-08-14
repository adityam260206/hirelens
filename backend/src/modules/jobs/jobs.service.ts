import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { paginate } from "../../utils/pagination";
import type { CreateJobInput, ListJobsQuery, UpdateJobInput } from "./jobs.schemas";

const JOB_CARD_SELECT = {
  id: true,
  title: true,
  department: true,
  location: true,
  workMode: true,
  employmentType: true,
  minExperience: true,
  maxExperience: true,
  salaryMin: true,
  salaryMax: true,
  requiredSkills: true,
  preferredSkills: true,
  status: true,
  deadline: true,
  publishedAt: true,
  createdAt: true,
  company: { select: { id: true, name: true, logoUrl: true } },
  _count: { select: { applications: true } },
} satisfies Prisma.JobSelect;

async function requireCompanyJob(jobId: string, companyId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.companyId !== companyId) throw ApiError.notFound("Job not found");
  return job;
}

export async function listJobsForRecruiter(companyId: string, query: ListJobsQuery) {
  const where: Prisma.JobWhereInput = {
    companyId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.workMode ? { workMode: query.workMode } : {}),
    ...(query.location ? { location: { contains: query.location, mode: "insensitive" } } : {}),
    ...(query.search ? { title: { contains: query.search, mode: "insensitive" } } : {}),
    ...(query.skill ? { requiredSkills: { has: query.skill } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.job.findMany({
      where,
      select: JOB_CARD_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.job.count({ where }),
  ]);

  return paginate(items, total, query.page, query.pageSize);
}

export async function listPublishedJobs(query: ListJobsQuery) {
  const where: Prisma.JobWhereInput = {
    status: "PUBLISHED",
    ...(query.workMode ? { workMode: query.workMode } : {}),
    ...(query.location ? { location: { contains: query.location, mode: "insensitive" } } : {}),
    ...(query.search ? { title: { contains: query.search, mode: "insensitive" } } : {}),
    ...(query.skill ? { requiredSkills: { has: query.skill } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.job.findMany({
      where,
      select: JOB_CARD_SELECT,
      orderBy: { publishedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.job.count({ where }),
  ]);

  return paginate(items, total, query.page, query.pageSize);
}

export async function getJobById(
  jobId: string,
  viewer: { id: string; role: string; companyId: string | null } | undefined
) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: { select: { id: true, name: true, logoUrl: true, website: true, description: true } },
      requirement: true,
      _count: { select: { applications: true } },
    },
  });
  if (!job) throw ApiError.notFound("Job not found");

  const isOwner = viewer?.role === "RECRUITER" && viewer.companyId === job.companyId;
  if (job.status !== "PUBLISHED" && !isOwner) {
    // Draft/closed jobs are invisible outside the owning company — treat as
    // not found rather than forbidden so we don't confirm the job's existence.
    throw ApiError.notFound("Job not found");
  }

  return job;
}

export async function createJob(companyId: string, createdById: string, input: CreateJobInput) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.job.create({
      data: {
        companyId,
        createdById,
        title: input.title,
        department: input.department,
        description: input.description,
        location: input.location,
        workMode: input.workMode,
        employmentType: input.employmentType,
        minExperience: input.minExperience,
        maxExperience: input.maxExperience,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        requiredSkills: input.requiredSkills,
        preferredSkills: input.preferredSkills,
        education: input.education,
        deadline: input.deadline,
      },
    });

    await tx.jobRequirement.create({
      data: {
        jobId: job.id,
        requiredSkills: input.requiredSkills,
        preferredSkills: input.preferredSkills,
        minimumExperience: input.minExperience,
        education: input.education,
      },
    });

    return job;
  });
}

export async function updateJob(jobId: string, companyId: string, input: UpdateJobInput) {
  const job = await requireCompanyJob(jobId, companyId);
  if (job.status === "CLOSED") throw ApiError.conflict("Closed jobs cannot be edited");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.job.update({ where: { id: jobId }, data: input });

    const requirementChanged =
      input.requiredSkills !== undefined ||
      input.preferredSkills !== undefined ||
      input.minExperience !== undefined ||
      input.education !== undefined;

    if (requirementChanged) {
      await tx.jobRequirement.update({
        where: { jobId },
        data: {
          ...(input.requiredSkills !== undefined ? { requiredSkills: input.requiredSkills } : {}),
          ...(input.preferredSkills !== undefined ? { preferredSkills: input.preferredSkills } : {}),
          ...(input.minExperience !== undefined ? { minimumExperience: input.minExperience } : {}),
          ...(input.education !== undefined ? { education: input.education } : {}),
        },
      });
    }

    return updated;
  });
}

export async function publishJob(jobId: string, companyId: string) {
  const job = await requireCompanyJob(jobId, companyId);
  if (job.status !== "DRAFT") throw ApiError.conflict("Only draft jobs can be published");
  if (job.requiredSkills.length === 0) {
    throw ApiError.badRequest("Add at least one required skill before publishing");
  }

  return prisma.job.update({
    where: { id: jobId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
}

export async function closeJob(jobId: string, companyId: string) {
  const job = await requireCompanyJob(jobId, companyId);
  if (job.status !== "PUBLISHED") throw ApiError.conflict("Only published jobs can be closed");

  return prisma.job.update({
    where: { id: jobId },
    data: { status: "CLOSED", closedAt: new Date() },
  });
}

export async function deleteJob(jobId: string, companyId: string) {
  const job = await requireCompanyJob(jobId, companyId);
  if (job.status !== "DRAFT") {
    throw ApiError.conflict(
      "Only draft jobs can be deleted — close published jobs instead to preserve hiring history"
    );
  }

  const applicationCount = await prisma.application.count({ where: { jobId } });
  if (applicationCount > 0) {
    throw ApiError.conflict("Cannot delete a job that already has applications");
  }

  await prisma.job.delete({ where: { id: jobId } });
}
