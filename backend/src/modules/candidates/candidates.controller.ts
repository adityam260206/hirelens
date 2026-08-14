import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { logActivity } from "../../utils/activityLog";
import { requireParam } from "../../utils/params";
import { listCandidatesQuerySchema, updateCandidateProfileSchema } from "./candidates.schemas";
import * as candidatesService from "./candidates.service";

export const getMyProfile = asyncHandler(async (req, res) => {
  const candidate = await candidatesService.getOwnProfile(req.user!.id);
  return ok(res, candidate);
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const input = updateCandidateProfileSchema.parse(req.body);
  const candidate = await candidatesService.updateOwnProfile(req.user!.id, input);
  await logActivity({
    userId: req.user!.id,
    action: "CANDIDATE_PROFILE_UPDATED",
    entityType: "Candidate",
    entityId: candidate.id,
  });
  return ok(res, candidate);
});

export const listCandidates = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const query = listCandidatesQuerySchema.parse(req.query);
  const result = await candidatesService.listCandidatesForCompany(req.user!.companyId, query);
  return ok(res, result);
});

export const getCandidate = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const candidate = await candidatesService.getCandidateForCompany(requireParam(req, "id"), req.user!.companyId);
  await logActivity({
    userId: req.user!.id,
    action: "CANDIDATE_VIEWED",
    entityType: "Candidate",
    entityId: candidate.id,
  });
  return ok(res, candidate);
});
