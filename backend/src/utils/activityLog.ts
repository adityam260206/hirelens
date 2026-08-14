import type { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { logger } from "./logger";

type ActivityLogInput = {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
};

// Audit logging is best-effort: a logging failure must never break the
// user-facing request that triggered it.
export async function logActivity(params: ActivityLogInput) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId ?? undefined,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? undefined,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: params.ipAddress ?? undefined,
      },
    });
  } catch (err) {
    logger.warn("Failed to write activity log", {
      action: params.action,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
