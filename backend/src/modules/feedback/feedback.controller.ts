import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, ok } from "../../utils/apiResponse";
import { requireParam } from "../../utils/params";
import { logActivity } from "../../utils/activityLog";
import { submitFeedbackSchema, updateFeedbackSchema } from "./feedback.schemas";
import * as feedbackService from "./feedback.service";

export const submitFeedback = asyncHandler(async (req, res) => {
  const interviewId = requireParam(req, "id");
  const input = submitFeedbackSchema.parse(req.body);
  const feedback = await feedbackService.submitFeedback(interviewId, req.user!.id, input);
  await logActivity({
    userId: req.user!.id,
    action: "FEEDBACK_SUBMITTED",
    entityType: "InterviewFeedback",
    entityId: feedback.id,
  });
  return created(res, feedback);
});

export const getFeedback = asyncHandler(async (req, res) => {
  const interviewId = requireParam(req, "id");

  if (req.user!.role === "INTERVIEWER") {
    const feedback = await feedbackService.getFeedbackForInterviewer(interviewId, req.user!.id);
    return ok(res, feedback);
  }

  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const feedback = await feedbackService.getFeedbackForCompany(interviewId, req.user!.companyId);
  return ok(res, feedback);
});

export const updateFeedback = asyncHandler(async (req, res) => {
  const feedbackId = requireParam(req, "id");
  const input = updateFeedbackSchema.parse(req.body);
  const feedback = await feedbackService.updateFeedback(feedbackId, req.user!.id, input);
  return ok(res, feedback);
});
