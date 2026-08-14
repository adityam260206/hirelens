import { apiClient } from "@/lib/api-client";
import type { CreateInterviewPayload, Interview, Interviewer, SubmitFeedbackPayload } from "@/types/interview";
import type { Paginated } from "@/types/job";

export const interviewsService = {
  create: (payload: CreateInterviewPayload) => apiClient.post<Interview>("/interviews", payload),
  listMine: (applicationId?: string) =>
    apiClient.get<Paginated<Interview>>(`/interviews${applicationId ? `?applicationId=${applicationId}` : ""}`),
  get: (id: string) => apiClient.get<Interview>(`/interviews/${id}`),
  cancel: (id: string) => apiClient.post<Interview>(`/interviews/${id}/cancel`),
  submitFeedback: (interviewId: string, payload: SubmitFeedbackPayload) =>
    apiClient.post(`/interviews/${interviewId}/feedback`, payload),
};

export const teamService = {
  listInterviewers: () => apiClient.get<Interviewer[]>("/team/interviewers"),
  createInterviewer: (payload: { email: string; password: string; firstName: string; lastName: string }) =>
    apiClient.post<Interviewer>("/team/interviewers", payload),
};
