import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import * as controller from "./resumes.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const resumesRouter = Router();

resumesRouter.post("/", requireAuth, requireRole("CANDIDATE"), upload.single("file"), controller.uploadResume);
resumesRouter.get("/", requireAuth, requireRole("CANDIDATE"), controller.listMyResumes);
resumesRouter.get("/:id", requireAuth, controller.getResume);
resumesRouter.get("/:id/file", requireAuth, controller.downloadResume);
resumesRouter.post("/:id/analyze", requireAuth, requireRole("CANDIDATE"), controller.analyzeResume);
