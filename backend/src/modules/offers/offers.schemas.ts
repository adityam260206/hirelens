import { z } from "zod";

export const createOfferSchema = z.object({
  position: z.string().trim().min(1).max(200),
  salary: z.coerce.number().int().min(0),
  currency: z.string().trim().min(1).max(10).default("USD"),
  joiningDate: z.coerce.date(),
  location: z.string().trim().max(200).optional(),
  benefits: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
  terms: z.string().trim().max(5000).optional(),
});

export const updateOfferSchema = z.object({
  position: z.string().trim().min(1).max(200).optional(),
  salary: z.coerce.number().int().min(0).optional(),
  currency: z.string().trim().min(1).max(10).optional(),
  joiningDate: z.coerce.date().optional(),
  location: z.string().trim().max(200).optional(),
  benefits: z.array(z.string().trim().min(1).max(200)).max(30).optional(),
  terms: z.string().trim().max(5000).optional(),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
