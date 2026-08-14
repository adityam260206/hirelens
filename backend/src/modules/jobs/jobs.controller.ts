import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, noContent, ok } from "../../utils/apiResponse";
import { logActivity } from "../../utils/activityLog";
import { requireParam } from "../../utils/params";
import { createJobSchema, listJobsQuerySchema, updateJobSchema } from "./jobs.schemas";
import * as jobsService from "./jobs.service";

export const listJobs = asyncHandler(async (req, res) => {
  const query = listJobsQuerySchema.parse(req.query);

  if (query.scope === "company") {
    if (req.user?.role !== "RECRUITER") throw ApiError.forbidden();
    if (!req.user.companyId) throw ApiError.forbidden("No company associated with this account");
    const result = await jobsService.listJobsForRecruiter(req.user.companyId, query);
    return ok(res, result);
  }

  const result = await jobsService.listPublishedJobs(query);
  return ok(res, result);
});

export const getJob = asyncHandler(async (req, res) => {
  const job = await jobsService.getJobById(requireParam(req, "id"), req.user);
  return ok(res, job);
});

export const createJob = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const input = createJobSchema.parse(req.body);
  const job = await jobsService.createJob(req.user!.companyId, req.user!.id, input);
  await logActivity({ userId: req.user!.id, action: "JOB_CREATED", entityType: "Job", entityId: job.id });
  return created(res, job);
});

export const updateJob = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const input = updateJobSchema.parse(req.body);
  const job = await jobsService.updateJob(requireParam(req, "id"), req.user!.companyId, input);
  await logActivity({ userId: req.user!.id, action: "JOB_UPDATED", entityType: "Job", entityId: job.id });
  return ok(res, job);
});

export const publishJob = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const job = await jobsService.publishJob(requireParam(req, "id"), req.user!.companyId);
  await logActivity({ userId: req.user!.id, action: "JOB_PUBLISHED", entityType: "Job", entityId: job.id });
  return ok(res, job);
});

export const closeJob = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const job = await jobsService.closeJob(requireParam(req, "id"), req.user!.companyId);
  await logActivity({ userId: req.user!.id, action: "JOB_CLOSED", entityType: "Job", entityId: job.id });
  return ok(res, job);
});

export const deleteJob = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const jobId = requireParam(req, "id");
  await jobsService.deleteJob(jobId, req.user!.companyId);
  await logActivity({ userId: req.user!.id, action: "JOB_DELETED", entityType: "Job", entityId: jobId });
  return noContent(res);
});
