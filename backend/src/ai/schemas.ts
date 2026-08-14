import { z } from "zod";

export const parsedResumeSchema = z.object({
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  summary: z.string().nullable(),
  skills: z.array(z.string()).default([]),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        fieldOfStudy: z.string().nullable().optional(),
        startYear: z.number().int().nullable().optional(),
        endYear: z.number().int().nullable().optional(),
      })
    )
    .default([]),
  experience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        startDate: z.string(),
        endDate: z.string().nullable().optional(),
        isCurrent: z.boolean().default(false),
        description: z.string().nullable().optional(),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().nullable().optional(),
        technologies: z.array(z.string()).default([]),
      })
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().nullable().optional(),
        year: z.number().int().nullable().optional(),
      })
    )
    .default([]),
  languages: z.array(z.string()).default([]),
});

export type ParsedResumeData = z.infer<typeof parsedResumeSchema>;

export const interviewQuestionSchema = z.object({
  question: z.string().min(1),
  category: z.enum(["Technical", "Behavioral", "Problem Solving", "Role-specific"]),
  relatedSkill: z.string().nullable(),
  reason: z.string().min(1),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
});

export const interviewQuestionsSchema = z.array(interviewQuestionSchema).max(15);

export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
