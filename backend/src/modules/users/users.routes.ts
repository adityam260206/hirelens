import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { createInterviewer, listInterviewers } from "./users.controller";

export const teamRouter = Router();

teamRouter.post("/interviewers", requireAuth, requireRole("RECRUITER"), createInterviewer);
teamRouter.get("/interviewers", requireAuth, requireRole("RECRUITER"), listInterviewers);
