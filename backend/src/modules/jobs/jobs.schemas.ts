import { z } from "zod";

export const workModeEnum = z.enum(["REMOTE", "ONSITE", "HYBRID"]);
export const employmentTypeEnum = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]);
export const jobStatusEnum = z.enum(["DRAFT", "PUBLISHED", "CLOSED"]);

export const createJobSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    department: z.string().trim().max(100).optional(),
    description: z.string().trim().min(1).max(10_000),
    location: z.string().trim().max(200).optional(),
    workMode: workModeEnum,
    employmentType: employmentTypeEnum,
    minExperience: z.coerce.number().int().min(0).max(50).default(0),
    maxExperience: z.coerce.number().int().min(0).max(50).optional(),
    salaryMin: z.coerce.number().int().min(0).optional(),
    salaryMax: z.coerce.number().int().min(0).optional(),
    requiredSkills: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
    preferredSkills: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
    education: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
    deadline: z.coerce.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.maxExperience !== undefined && data.maxExperience < data.minExperience) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxExperience"],
        message: "maxExperience must be greater than or equal to minExperience",
      });
    }
    if (data.salaryMin !== undefined && data.salaryMax !== undefined && data.salaryMax < data.salaryMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["salaryMax"],
        message: "salaryMax must be greater than or equal to salaryMin",
      });
    }
  });

export const updateJobSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  department: z.string().trim().max(100).optional(),
  description: z.string().trim().min(1).max(10_000).optional(),
  location: z.string().trim().max(200).optional(),
  workMode: workModeEnum.optional(),
  employmentType: employmentTypeEnum.optional(),
  minExperience: z.coerce.number().int().min(0).max(50).optional(),
  maxExperience: z.coerce.number().int().min(0).max(50).optional(),
  salaryMin: z.coerce.number().int().min(0).optional(),
  salaryMax: z.coerce.number().int().min(0).optional(),
  requiredSkills: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  preferredSkills: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  education: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  deadline: z.coerce.date().optional(),
});

export const listJobsQuerySchema = z.object({
  // "public" always returns published jobs regardless of who's asking — this is
  // what the job board renders, even for a logged-in recruiter browsing it.
  // "company" returns the caller's own company jobs across all statuses, and
  // is only valid for an authenticated recruiter (the recruiter dashboard).
  scope: z.enum(["public", "company"]).default("public"),
  search: z.string().trim().max(200).optional(),
  status: jobStatusEnum.optional(),
  workMode: workModeEnum.optional(),
  location: z.string().trim().max(200).optional(),
  skill: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
