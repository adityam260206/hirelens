import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { getMyCompany, updateMyCompany } from "./companies.controller";

export const companiesRouter = Router();

companiesRouter.get("/me", requireAuth, requireRole("RECRUITER"), getMyCompany);
companiesRouter.patch("/me", requireAuth, requireRole("RECRUITER"), updateMyCompany);
