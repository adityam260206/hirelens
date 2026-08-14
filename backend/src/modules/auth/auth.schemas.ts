import { z } from "zod";

// Interviewer accounts are provisioned by recruiters within their company
// (see the team/interviewers endpoint added in the interviews module), not
// self-registered — so public registration only offers these two roles.
export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100)
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    role: z.enum(["CANDIDATE", "RECRUITER"]),
    companyName: z.string().trim().min(1).max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "RECRUITER" && !data.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyName"],
        message: "companyName is required when registering as a recruiter",
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
