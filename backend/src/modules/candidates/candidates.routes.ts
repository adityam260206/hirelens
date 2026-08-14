import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { getCandidate, getMyProfile, listCandidates, updateMyProfile } from "./candidates.controller";

export const candidatesRouter = Router();

candidatesRouter.get("/me", requireAuth, requireRole("CANDIDATE"), getMyProfile);
candidatesRouter.patch("/me", requireAuth, requireRole("CANDIDATE"), updateMyProfile);
candidatesRouter.get("/", requireAuth, requireRole("RECRUITER"), listCandidates);
candidatesRouter.get("/:id", requireAuth, requireRole("RECRUITER"), getCandidate);
