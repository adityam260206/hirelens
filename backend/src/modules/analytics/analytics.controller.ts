import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { requireParam } from "../../utils/params";
import * as analyticsService from "./analytics.service";

export const getOverview = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const overview = await analyticsService.getOverview(req.user!.companyId);
  return ok(res, overview);
});

export const getFunnel = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const funnel = await analyticsService.getFunnel(req.user!.companyId);
  return ok(res, funnel);
});

export const getJobAnalytics = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const jobId = requireParam(req, "id");
  const analytics = await analyticsService.getJobAnalytics(jobId, req.user!.companyId);
  return ok(res, analytics);
});
