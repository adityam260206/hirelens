import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../utils/logger";
import { aiProvider } from "../../ai";
import { parsedResumeSchema } from "../../ai/schemas";
import { computeMatch } from "../../ai/matching/engine";
import type { MatchJobInput } from "../../ai/matching/types";

async function loadApplicationForAnalysis(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { include: { requirement: true } },
      resume: true,
      candidate: true,
    },
  });
  if (!application) throw ApiError.notFound("Application not found");
  return application;
}

function toJobInput(job: NonNullable<Awaited<ReturnType<typeof loadApplicationForAnalysis>>>["job"]): MatchJobInput {
  return {
    title: job.title,
    requiredSkills: job.requirement?.requiredSkills ?? job.requiredSkills,
    preferredSkills: job.requirement?.preferredSkills ?? job.preferredSkills,
    minExperience: job.requirement?.minimumExperience ?? job.minExperience,
    education: job.requirement?.education ?? job.education,
  };
}

async function runAnalysis(applicationId: string) {
  const application = await loadApplicationForAnalysis(applicationId);

  if (application.resume.parseStatus !== "COMPLETED" || !application.resume.parsedData) {
    throw ApiError.conflict("This application's resume hasn't finished parsing yet");
  }

  const parsedResume = parsedResumeSchema.parse(application.resume.parsedData);
  const jobInput = toJobInput(application.job);

  const result = computeMatch({
    job: jobInput,
    resume: parsedResume,
    profileSkills: application.candidate.skills,
  });

  let aiNarrative: string | null = null;
  try {
    aiNarrative = await aiProvider.summarizeMatch({
      jobTitle: jobInput.title,
      overallScore: result.overallScore,
      strengths: result.strengths,
      skillGaps: result.skillGaps,
      recommendation: result.recommendation,
    });
  } catch (err) {
    // The deterministic score/evidence is already complete and useful on its
    // own — a narrative failure is never fatal to the analysis.
    logger.warn("Match narrative generation failed", {
      applicationId,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  const data = {
    overallScore: result.overallScore,
    technicalScore: result.technicalScore,
    experienceScore: result.experienceScore,
    projectScore: result.projectScore,
    educationScore: result.educationScore,
    roleAlignmentScore: result.roleAlignmentScore,
    strengths: result.strengths,
    skillGaps: result.skillGaps,
    weakEvidence: result.weakEvidence,
    evidence: result.evidence as unknown as Prisma.InputJsonValue,
    recommendation: result.recommendation,
    confidence: result.confidence,
    aiNarrative,
    aiModel: aiProvider.modelName,
    aiVersion: "1",
    status: "COMPLETED" as const,
  };

  return prisma.candidateMatch.upsert({
    where: { applicationId },
    create: { applicationId, ...data },
    update: { ...data, analyzedAt: new Date() },
  });
}

export async function analyzeApplication(applicationId: string, companyId: string) {
  const application = await loadApplicationForAnalysis(applicationId);
  if (application.job.companyId !== companyId) throw ApiError.notFound("Application not found");
  return runAnalysis(applicationId);
}

// Best-effort auto-analysis triggered right after a candidate applies.
// Failures here must never block the application itself — a recruiter can
// always retrigger via POST /applications/:id/analyze.
export async function analyzeApplicationSilently(applicationId: string) {
  try {
    await runAnalysis(applicationId);
  } catch (err) {
    logger.warn("Automatic match analysis failed", {
      applicationId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function getMatchForCompany(applicationId: string, companyId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: { select: { companyId: true } }, match: true },
  });
  if (!application || application.job.companyId !== companyId) {
    throw ApiError.notFound("Application not found");
  }
  if (!application.match) throw ApiError.notFound("This application hasn't been analyzed yet");
  return application.match;
}

export async function generateInterviewQuestions(applicationId: string, companyId: string) {
  const application = await loadApplicationForAnalysis(applicationId);
  if (application.job.companyId !== companyId) throw ApiError.notFound("Application not found");

  const match = await prisma.candidateMatch.findUnique({ where: { applicationId } });
  const jobInput = toJobInput(application.job);

  return aiProvider.generateInterviewQuestions({
    jobTitle: application.job.title,
    jobDescription: application.job.description,
    requiredSkills: jobInput.requiredSkills,
    preferredSkills: jobInput.preferredSkills,
    skillGaps: match?.skillGaps ?? [],
  });
}
