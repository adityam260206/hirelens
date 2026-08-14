import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { paginate } from "../../utils/pagination";
import type { CreateInterviewInput, ListInterviewsQuery, UpdateInterviewInput } from "./interviews.schemas";

const INTERVIEW_DETAIL_INCLUDE = {
  application: {
    include: {
      job: { select: { id: true, title: true, companyId: true } },
      candidate: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
    },
  },
  interviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
  feedback: true,
} satisfies Prisma.InterviewInclude;

export async function createInterview(companyId: string, input: CreateInterviewInput) {
  const application = await prisma.application.findUnique({
    where: { id: input.applicationId },
    include: { job: { select: { companyId: true } } },
  });
  if (!application || application.job.companyId !== companyId) {
    throw ApiError.notFound("Application not found");
  }

  const interviewer = await prisma.user.findUnique({ where: { id: input.interviewerId } });
  if (!interviewer || interviewer.role !== "INTERVIEWER" || interviewer.companyId !== companyId) {
    throw ApiError.badRequest("Select an interviewer from your company");
  }

  return prisma.interview.create({
    data: {
      applicationId: input.applicationId,
      interviewerId: input.interviewerId,
      type: input.type,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes,
      meetingLink: input.meetingLink || undefined,
      notes: input.notes,
    },
    include: INTERVIEW_DETAIL_INCLUDE,
  });
}

export async function listInterviewsForCompany(companyId: string, query: ListInterviewsQuery) {
  const where: Prisma.InterviewWhereInput = {
    application: { job: { companyId } },
    ...(query.applicationId ? { applicationId: query.applicationId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.interview.findMany({
      where,
      include: INTERVIEW_DETAIL_INCLUDE,
      orderBy: { scheduledAt: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.interview.count({ where }),
  ]);
  return paginate(items, total, query.page, query.pageSize);
}

export async function listInterviewsForCandidate(candidateUserId: string, query: ListInterviewsQuery) {
  const candidate = await prisma.candidate.findUnique({ where: { userId: candidateUserId } });
  if (!candidate) throw ApiError.notFound("Candidate profile not found");

  const where: Prisma.InterviewWhereInput = {
    application: { candidateId: candidate.id },
    ...(query.applicationId ? { applicationId: query.applicationId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.interview.findMany({
      where,
      include: INTERVIEW_DETAIL_INCLUDE,
      orderBy: { scheduledAt: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.interview.count({ where }),
  ]);
  return paginate(items, total, query.page, query.pageSize);
}

export async function listInterviewsForInterviewer(interviewerId: string, query: ListInterviewsQuery) {
  const where: Prisma.InterviewWhereInput = {
    interviewerId,
    ...(query.applicationId ? { applicationId: query.applicationId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.interview.findMany({
      where,
      include: INTERVIEW_DETAIL_INCLUDE,
      orderBy: { scheduledAt: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.interview.count({ where }),
  ]);
  return paginate(items, total, query.page, query.pageSize);
}

async function getInterviewOr404(id: string) {
  const interview = await prisma.interview.findUnique({ where: { id }, include: INTERVIEW_DETAIL_INCLUDE });
  if (!interview) throw ApiError.notFound("Interview not found");
  return interview;
}

export async function getInterviewForCompany(id: string, companyId: string) {
  const interview = await getInterviewOr404(id);
  if (interview.application.job.companyId !== companyId) throw ApiError.notFound("Interview not found");
  return interview;
}

export async function getInterviewForInterviewer(id: string, interviewerId: string) {
  const interview = await getInterviewOr404(id);
  if (interview.interviewerId !== interviewerId) throw ApiError.notFound("Interview not found");
  return interview;
}

export async function getInterviewForCandidate(id: string, candidateUserId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { userId: candidateUserId } });
  const interview = await getInterviewOr404(id);
  if (!candidate || interview.application.candidateId !== candidate.id) {
    throw ApiError.notFound("Interview not found");
  }
  return interview;
}

export async function updateInterview(id: string, companyId: string, input: UpdateInterviewInput) {
  const interview = await getInterviewOr404(id);
  if (interview.application.job.companyId !== companyId) throw ApiError.notFound("Interview not found");
  if (interview.status === "CANCELLED") throw ApiError.conflict("This interview has been cancelled");

  return prisma.interview.update({
    where: { id },
    data: {
      ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
      ...(input.durationMinutes !== undefined ? { durationMinutes: input.durationMinutes } : {}),
      ...(input.meetingLink !== undefined ? { meetingLink: input.meetingLink || null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    include: INTERVIEW_DETAIL_INCLUDE,
  });
}

export async function cancelInterview(id: string, companyId: string) {
  const interview = await getInterviewOr404(id);
  if (interview.application.job.companyId !== companyId) throw ApiError.notFound("Interview not found");
  if (interview.status !== "SCHEDULED") throw ApiError.conflict("Only scheduled interviews can be cancelled");

  return prisma.interview.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: INTERVIEW_DETAIL_INCLUDE,
  });
}
