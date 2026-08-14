import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, ok } from "../../utils/apiResponse";
import { requireParam } from "../../utils/params";
import { logActivity } from "../../utils/activityLog";
import * as resumesService from "./resumes.service";

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file was uploaded");

  const resume = await resumesService.uploadResume(req.user!.id, {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    buffer: req.file.buffer,
    size: req.file.size,
  });

  await logActivity({ userId: req.user!.id, action: "RESUME_UPLOADED", entityType: "Resume", entityId: resume.id });
  return created(res, resume);
});

export const listMyResumes = asyncHandler(async (req, res) => {
  const resumes = await resumesService.listMyResumes(req.user!.id);
  return ok(res, resumes);
});

// Resolves a resume for any non-candidate viewer, scoped correctly per role:
// interviewers only reach resumes tied to an interview they're assigned to;
// recruiters reach any resume attached to their company's applications.
async function resolveResumeForStaffViewer(id: string, user: { id: string; role: string; companyId: string | null }) {
  if (user.role === "INTERVIEWER") {
    return resumesService.getResumeForInterviewer(id, user.id);
  }
  if (user.role !== "RECRUITER" || !user.companyId) {
    throw ApiError.forbidden();
  }
  return resumesService.getResumeForCompany(id, user.companyId);
}

export const getResume = asyncHandler(async (req, res) => {
  const id = requireParam(req, "id");

  if (req.user!.role === "CANDIDATE") {
    const resume = await resumesService.getResumeForCandidate(id, req.user!.id);
    return ok(res, resume);
  }

  const resume = await resolveResumeForStaffViewer(id, req.user!);
  await logActivity({ userId: req.user!.id, action: "RESUME_VIEWED", entityType: "Resume", entityId: id });
  return ok(res, resume);
});

export const downloadResume = asyncHandler(async (req, res) => {
  const id = requireParam(req, "id");

  let resume;
  if (req.user!.role === "CANDIDATE") {
    resume = await resumesService.getResumeForCandidate(id, req.user!.id);
  } else {
    resume = await resolveResumeForStaffViewer(id, req.user!);
    await logActivity({ userId: req.user!.id, action: "RESUME_DOWNLOADED", entityType: "Resume", entityId: id });
  }

  const buffer = await resumesService.getResumeFile(resume);
  res.setHeader("Content-Type", resume.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(resume.originalFilename)}"`);
  return res.send(buffer);
});

export const analyzeResume = asyncHandler(async (req, res) => {
  const id = requireParam(req, "id");
  const resume = await resumesService.retryResumeAnalysis(id, req.user!.id);
  return ok(res, resume);
});
