import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  website: z.string().trim().url().max(300).optional().or(z.literal("")),
  logoUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
