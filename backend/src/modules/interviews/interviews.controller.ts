import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, ok } from "../../utils/apiResponse";
import { requireParam } from "../../utils/params";
import { logActivity } from "../../utils/activityLog";
import { createInterviewSchema, listInterviewsQuerySchema, updateInterviewSchema } from "./interviews.schemas";
import * as interviewsService from "./interviews.service";

export const createInterview = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const input = createInterviewSchema.parse(req.body);
  const interview = await interviewsService.createInterview(req.user!.companyId, input);
  await logActivity({
    userId: req.user!.id,
    action: "INTERVIEW_SCHEDULED",
    entityType: "Interview",
    entityId: interview.id,
  });
  return created(res, interview);
});

export const listInterviews = asyncHandler(async (req, res) => {
  const query = listInterviewsQuerySchema.parse(req.query);

  if (req.user!.role === "INTERVIEWER") {
    const result = await interviewsService.listInterviewsForInterviewer(req.user!.id, query);
    return ok(res, result);
  }

  if (req.user!.role === "CANDIDATE") {
    const result = await interviewsService.listInterviewsForCandidate(req.user!.id, query);
    return ok(res, result);
  }

  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const result = await interviewsService.listInterviewsForCompany(req.user!.companyId, query);
  return ok(res, result);
});

export const getInterview = asyncHandler(async (req, res) => {
  const id = requireParam(req, "id");

  if (req.user!.role === "INTERVIEWER") {
    const interview = await interviewsService.getInterviewForInterviewer(id, req.user!.id);
    return ok(res, interview);
  }

  if (req.user!.role === "CANDIDATE") {
    const interview = await interviewsService.getInterviewForCandidate(id, req.user!.id);
    return ok(res, interview);
  }

  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const interview = await interviewsService.getInterviewForCompany(id, req.user!.companyId);
  return ok(res, interview);
});

export const updateInterview = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const id = requireParam(req, "id");
  const input = updateInterviewSchema.parse(req.body);
  const interview = await interviewsService.updateInterview(id, req.user!.companyId, input);
  await logActivity({ userId: req.user!.id, action: "INTERVIEW_UPDATED", entityType: "Interview", entityId: id });
  return ok(res, interview);
});

export const cancelInterview = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const id = requireParam(req, "id");
  const interview = await interviewsService.cancelInterview(id, req.user!.companyId);
  await logActivity({ userId: req.user!.id, action: "INTERVIEW_CANCELLED", entityType: "Interview", entityId: id });
  return ok(res, interview);
});
