import { apiClient } from "@/lib/api-client";
import type { CandidateMatch } from "@/types/match";
import type { InterviewQuestion } from "@/types/interviewQuestion";

export const matchingService = {
  get: (applicationId: string) => apiClient.get<CandidateMatch>(`/applications/${applicationId}/match`),
  analyze: (applicationId: string) => apiClient.post<CandidateMatch>(`/applications/${applicationId}/analyze`),
  interviewQuestions: (applicationId: string) =>
    apiClient.get<InterviewQuestion[]>(`/applications/${applicationId}/interview-questions`),
};
