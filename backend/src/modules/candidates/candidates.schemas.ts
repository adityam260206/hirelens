import { z } from "zod";

const educationEntrySchema = z.object({
  institution: z.string().trim().min(1).max(200),
  degree: z.string().trim().min(1).max(200),
  fieldOfStudy: z.string().trim().max(200).optional(),
  startYear: z.number().int().min(1950).max(2100).optional(),
  endYear: z.number().int().min(1950).max(2100).optional(),
  description: z.string().trim().max(1000).optional(),
});

const experienceEntrySchema = z.object({
  company: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  startDate: z.string().trim().min(1).max(50),
  endDate: z.string().trim().max(50).optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().trim().max(2000).optional(),
});

const projectEntrySchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  technologies: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  url: z.string().trim().url().max(300).optional().or(z.literal("")),
});

const certificationEntrySchema = z.object({
  name: z.string().trim().min(1).max(200),
  issuer: z.string().trim().max(200).optional(),
  year: z.number().int().min(1950).max(2100).optional(),
});

export const updateCandidateProfileSchema = z.object({
  phone: z.string().trim().max(30).optional(),
  location: z.string().trim().max(200).optional(),
  summary: z.string().trim().max(2000).optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(100).optional(),
  education: z.array(educationEntrySchema).max(20).optional(),
  experience: z.array(experienceEntrySchema).max(30).optional(),
  projects: z.array(projectEntrySchema).max(30).optional(),
  certifications: z.array(certificationEntrySchema).max(30).optional(),
  languages: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
});

export const listCandidatesQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  jobId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type UpdateCandidateProfileInput = z.infer<typeof updateCandidateProfileSchema>;
export type ListCandidatesQuery = z.infer<typeof listCandidatesQuerySchema>;
