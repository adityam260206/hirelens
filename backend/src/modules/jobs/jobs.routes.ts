import { Router } from "express";
import { attachUserIfPresent, requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { applyToJob } from "../applications/applications.controller";
import * as controller from "./jobs.controller";

export const jobsRouter = Router();

jobsRouter.get("/", attachUserIfPresent, controller.listJobs);
jobsRouter.get("/:id", attachUserIfPresent, controller.getJob);
jobsRouter.post("/", requireAuth, requireRole("RECRUITER"), controller.createJob);
jobsRouter.post("/:jobId/applications", requireAuth, requireRole("CANDIDATE"), applyToJob);
jobsRouter.patch("/:id", requireAuth, requireRole("RECRUITER"), controller.updateJob);
jobsRouter.delete("/:id", requireAuth, requireRole("RECRUITER"), controller.deleteJob);
jobsRouter.post("/:id/publish", requireAuth, requireRole("RECRUITER"), controller.publishJob);
jobsRouter.post("/:id/close", requireAuth, requireRole("RECRUITER"), controller.closeJob);
