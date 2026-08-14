import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { updateFeedback } from "./feedback.controller";

// Standalone PATCH /feedback/:id — POST/GET feedback are nested under
// /interviews/:id/feedback (see interviews.routes.ts) to match the spec's
// REST shape; this router only carries the top-level edit endpoint.
export const feedbackRouter = Router();

feedbackRouter.patch("/:id", requireAuth, requireRole("INTERVIEWER"), updateFeedback);
