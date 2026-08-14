import { Router } from "express";
import { prisma } from "../../config/db";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    let database: "up" | "down" = "down";
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = "up";
    } catch {
      database = "down";
    }

    const status = database === "up" ? "ok" : "degraded";
    return ok(res, {
      status,
      database,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    });
  })
);
