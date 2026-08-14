import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { getFunnel, getJobAnalytics, getOverview } from "./analytics.controller";

export const analyticsRouter = Router();

analyticsRouter.get("/overview", requireAuth, requireRole("RECRUITER"), getOverview);
analyticsRouter.get("/funnel", requireAuth, requireRole("RECRUITER"), getFunnel);
analyticsRouter.get("/jobs/:id", requireAuth, requireRole("RECRUITER"), getJobAnalytics);
