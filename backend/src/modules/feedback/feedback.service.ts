import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../utils/logger";
import { aiProvider } from "../../ai";
import type { SubmitFeedbackInput, UpdateFeedbackInput } from "./feedback.schemas";

async function getInterviewContext(interviewId: string) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: {
          job: { select: { companyId: true, title: true } },
          candidate: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      },
    },
  });
  if (!interview) throw ApiError.notFound("Interview not found");
  return interview;
}

async function buildAiSummary(
  input: SubmitFeedbackInput,
  context: { candidateName: string; jobTitle: string }
): Promise<string | null> {
  const ratings = [
    { category: "Technical", rating: input.technicalRating ?? null, comment: input.technicalComment ?? null },
    {
      category: "Communication",
      rating: input.communicationRating ?? null,
      comment: input.communicationComment ?? null,
    },
    {
      category: "Problem solving",
      rating: input.problemSolvingRating ?? null,
      comment: input.problemSolvingComment ?? null,
    },
    { category: "Teamwork", rating: input.teamworkRating ?? null, comment: input.teamworkComment ?? null },
    { category: "Leadership", rating: input.leadershipRating ?? null, comment: input.leadershipComment ?? null },
  ];

  try {
    return await aiProvider.summarizeFeedback({
      candidateName: context.candidateName,
      jobTitle: context.jobTitle,
      overallRecommendation: input.overallRecommendation,
      ratings,
    });
  } catch (err) {
    logger.warn("Feedback summary generation failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function submitFeedback(interviewId: string, interviewerId: string, input: SubmitFeedbackInput) {
  const interview = await getInterviewContext(interviewId);
  if (interview.interviewerId !== interviewerId) throw ApiError.notFound("Interview not found");

  if (interview.status === "CANCELLED") {
    throw ApiError.conflict("Cannot submit feedback for a cancelled interview");
  }

  const existing = await prisma.interviewFeedback.findUnique({ where: { interviewId } });
  if (existing) throw ApiError.conflict("Feedback has already been submitted for this interview");

  const aiSummary = await buildAiSummary(input, {
    candidateName: `${interview.application.candidate.user.firstName} ${interview.application.candidate.user.lastName}`,
    jobTitle: interview.application.job.title,
  });

  return prisma.$transaction(async (tx) => {
    const feedback = await tx.interviewFeedback.create({
      data: { interviewId, submittedById: interviewerId, ...input, aiSummary },
    });
    // Submitting feedback is the natural signal that the interview happened.
    await tx.interview.update({ where: { id: interviewId }, data: { status: "COMPLETED" } });
    return feedback;
  });
}

export async function updateFeedback(feedbackId: string, interviewerId: string, input: UpdateFeedbackInput) {
  const feedback = await prisma.interviewFeedback.findUnique({ where: { id: feedbackId } });
  if (!feedback || feedback.submittedById !== interviewerId) throw ApiError.notFound("Feedback not found");

  return prisma.interviewFeedback.update({ where: { id: feedbackId }, data: input });
}

export async function getFeedbackForCompany(interviewId: string, companyId: string) {
  const interview = await getInterviewContext(interviewId);
  if (interview.application.job.companyId !== companyId) throw ApiError.notFound("Interview not found");

  const feedback = await prisma.interviewFeedback.findUnique({ where: { interviewId } });
  if (!feedback) throw ApiError.notFound("No feedback has been submitted for this interview yet");
  return feedback;
}

export async function getFeedbackForInterviewer(interviewId: string, interviewerId: string) {
  const interview = await getInterviewContext(interviewId);
  if (interview.interviewerId !== interviewerId) throw ApiError.notFound("Interview not found");

  const feedback = await prisma.interviewFeedback.findUnique({ where: { interviewId } });
  if (!feedback) throw ApiError.notFound("No feedback has been submitted for this interview yet");
  return feedback;
}
