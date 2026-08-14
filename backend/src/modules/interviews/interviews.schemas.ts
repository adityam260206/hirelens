import { z } from "zod";

export const interviewTypeEnum = z.enum(["TECHNICAL", "HR", "BEHAVIORAL", "MANAGERIAL", "OTHER"]);
export const interviewStatusEnum = z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]);

export const createInterviewSchema = z.object({
  applicationId: z.string().uuid(),
  interviewerId: z.string().uuid(),
  type: interviewTypeEnum,
  scheduledAt: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(15).max(240).default(45),
  meetingLink: z.string().trim().url().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional(),
});

export const updateInterviewSchema = z.object({
  scheduledAt: z.coerce.date().optional(),
  durationMinutes: z.coerce.number().int().min(15).max(240).optional(),
  meetingLink: z.string().trim().url().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional(),
  status: interviewStatusEnum.optional(),
});

export const listInterviewsQuerySchema = z.object({
  applicationId: z.string().uuid().optional(),
  status: interviewStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
export type ListInterviewsQuery = z.infer<typeof listInterviewsQuerySchema>;
