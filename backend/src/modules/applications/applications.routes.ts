import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { createOffer } from "../offers/offers.controller";
import {
  analyzeApplicationMatch,
  getApplication,
  getApplicationMatch,
  getInterviewQuestions,
  listApplications,
  updateApplicationStatus,
} from "./applications.controller";

export const applicationsRouter = Router();

applicationsRouter.get("/", requireAuth, listApplications);
applicationsRouter.get("/:id", requireAuth, getApplication);
applicationsRouter.patch("/:id/status", requireAuth, requireRole("RECRUITER"), updateApplicationStatus);
applicationsRouter.post("/:id/analyze", requireAuth, requireRole("RECRUITER"), analyzeApplicationMatch);
applicationsRouter.get("/:id/match", requireAuth, requireRole("RECRUITER"), getApplicationMatch);
applicationsRouter.post("/:id/offer", requireAuth, requireRole("RECRUITER"), createOffer);
applicationsRouter.get("/:id/interview-questions", requireAuth, requireRole("RECRUITER"), getInterviewQuestions);
