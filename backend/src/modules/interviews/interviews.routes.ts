import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { getFeedback, submitFeedback } from "../feedback/feedback.controller";
import * as controller from "./interviews.controller";

export const interviewsRouter = Router();

interviewsRouter.post("/", requireAuth, requireRole("RECRUITER"), controller.createInterview);
interviewsRouter.get("/", requireAuth, controller.listInterviews);
interviewsRouter.get("/:id", requireAuth, controller.getInterview);
interviewsRouter.patch("/:id", requireAuth, requireRole("RECRUITER"), controller.updateInterview);
interviewsRouter.post("/:id/cancel", requireAuth, requireRole("RECRUITER"), controller.cancelInterview);
interviewsRouter.post("/:id/feedback", requireAuth, requireRole("INTERVIEWER"), submitFeedback);
interviewsRouter.get("/:id/feedback", requireAuth, getFeedback);
