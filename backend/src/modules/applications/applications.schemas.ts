import { z } from "zod";

export const applicationStatusEnum = z.enum([
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "TECHNICAL_INTERVIEW",
  "HR_INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
]);

export const createApplicationSchema = z.object({
  resumeId: z.string().uuid(),
});

export const updateApplicationStatusSchema = z.object({
  status: applicationStatusEnum,
});

export const listApplicationsQuerySchema = z.object({
  jobId: z.string().uuid().optional(),
  status: applicationStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;
