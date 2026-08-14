import { z } from "zod";

// Interviewer accounts are provisioned by a recruiter within their own
// company, not self-registered (see auth.schemas.ts) — recruiters set an
// initial password directly since there's no email/invite infrastructure.
export const createInterviewerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
});

export type CreateInterviewerInput = z.infer<typeof createInterviewerSchema>;
