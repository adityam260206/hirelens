import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import * as controller from "./offers.controller";

export const offersRouter = Router();

offersRouter.get("/:id", requireAuth, controller.getOffer);
offersRouter.patch("/:id", requireAuth, requireRole("RECRUITER"), controller.updateOffer);
offersRouter.post("/:id/send", requireAuth, requireRole("RECRUITER"), controller.sendOffer);
offersRouter.post("/:id/withdraw", requireAuth, requireRole("RECRUITER"), controller.withdrawOffer);
offersRouter.post("/:id/accept", requireAuth, requireRole("CANDIDATE"), controller.acceptOffer);
offersRouter.post("/:id/reject", requireAuth, requireRole("CANDIDATE"), controller.rejectOffer);
