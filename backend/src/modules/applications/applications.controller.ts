import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, ok } from "../../utils/apiResponse";
import { logActivity } from "../../utils/activityLog";
import { requireParam } from "../../utils/params";
import {
  createApplicationSchema,
  listApplicationsQuerySchema,
  updateApplicationStatusSchema,
} from "./applications.schemas";
import * as applicationsService from "./applications.service";
import * as matchingService from "../matching/matching.service";

export const applyToJob = asyncHandler(async (req, res) => {
  const jobId = requireParam(req, "jobId");
  const { resumeId } = createApplicationSchema.parse(req.body);
  const application = await applicationsService.applyToJob(req.user!.id, jobId, resumeId);
  await logActivity({
    userId: req.user!.id,
    action: "APPLICATION_SUBMITTED",
    entityType: "Application",
    entityId: application.id,
  });
  return created(res, application);
});

export const listApplications = asyncHandler(async (req, res) => {
  const query = listApplicationsQuerySchema.parse(req.query);

  if (req.user!.role === "CANDIDATE") {
    const result = await applicationsService.listMyApplications(req.user!.id, query);
    return ok(res, result);
  }

  // The full company-wide applications list (match scores, resume status,
  // candidate profiles) is recruiter-only. Interviewers have a companyId too,
  // but get candidate/job context through their assigned interviews instead
  // (see GET /interviews/:id), scoped to what they're actually conducting.
  if (req.user!.role !== "RECRUITER" || !req.user!.companyId) {
    throw ApiError.forbidden();
  }
  const result = await applicationsService.listApplicationsForCompany(req.user!.companyId, query);
  return ok(res, result);
});

export const getApplication = asyncHandler(async (req, res) => {
  const id = requireParam(req, "id");

  if (req.user!.role === "CANDIDATE") {
    const application = await applicationsService.getApplicationForCandidate(id, req.user!.id);
    return ok(res, application);
  }

  if (req.user!.role !== "RECRUITER" || !req.user!.companyId) {
    throw ApiError.forbidden();
  }
  const application = await applicationsService.getApplicationForCompany(id, req.user!.companyId);
  return ok(res, application);
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const id = requireParam(req, "id");
  const { status } = updateApplicationStatusSchema.parse(req.body);
  const application = await applicationsService.updateApplicationStatus(
    id,
    req.user!.companyId,
    status,
    req.user!.id
  );
  return ok(res, application);
});

export const analyzeApplicationMatch = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const id = requireParam(req, "id");
  const match = await matchingService.analyzeApplication(id, req.user!.companyId);
  return ok(res, match);
});

export const getApplicationMatch = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const id = requireParam(req, "id");
  const match = await matchingService.getMatchForCompany(id, req.user!.companyId);
  return ok(res, match);
});

export const getInterviewQuestions = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const id = requireParam(req, "id");
  const questions = await matchingService.generateInterviewQuestions(id, req.user!.companyId);
  return ok(res, questions);
});
