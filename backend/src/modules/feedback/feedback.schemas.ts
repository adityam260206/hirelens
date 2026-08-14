import { z } from "zod";

export const recommendationEnum = z.enum(["STRONG_HIRE", "HIRE", "NEUTRAL", "NO_HIRE", "STRONG_NO_HIRE"]);

const ratingField = z.coerce.number().int().min(1).max(5).optional();

export const submitFeedbackSchema = z.object({
  technicalRating: ratingField,
  technicalComment: z.string().trim().max(1000).optional(),
  communicationRating: ratingField,
  communicationComment: z.string().trim().max(1000).optional(),
  problemSolvingRating: ratingField,
  problemSolvingComment: z.string().trim().max(1000).optional(),
  teamworkRating: ratingField,
  teamworkComment: z.string().trim().max(1000).optional(),
  leadershipRating: ratingField,
  leadershipComment: z.string().trim().max(1000).optional(),
  overallRecommendation: recommendationEnum,
  summary: z.string().trim().max(2000).optional(),
});

export const updateFeedbackSchema = submitFeedbackSchema.partial();

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
