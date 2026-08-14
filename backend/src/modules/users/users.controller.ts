import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, ok } from "../../utils/apiResponse";
import { logActivity } from "../../utils/activityLog";
import { createInterviewerSchema } from "./users.schemas";
import * as usersService from "./users.service";

export const createInterviewer = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const input = createInterviewerSchema.parse(req.body);
  const interviewer = await usersService.createInterviewer(req.user!.companyId, input);
  await logActivity({
    userId: req.user!.id,
    action: "INTERVIEWER_CREATED",
    entityType: "User",
    entityId: interviewer.id,
  });
  return created(res, interviewer);
});

export const listInterviewers = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const interviewers = await usersService.listInterviewers(req.user!.companyId);
  return ok(res, interviewers);
});
