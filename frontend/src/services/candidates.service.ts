import { apiClient } from "@/lib/api-client";
import type { CandidateProfile, CandidateSummary, UpdateCandidateProfilePayload } from "@/types/candidate";
import type { Paginated } from "@/types/job";

export const candidatesService = {
  getMyProfile: () => apiClient.get<CandidateProfile>("/candidates/me"),
  updateMyProfile: (payload: UpdateCandidateProfilePayload) =>
    apiClient.patch<CandidateProfile>("/candidates/me", payload),
  list: (params?: { search?: string; jobId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.jobId) qs.set("jobId", params.jobId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiClient.get<Paginated<CandidateSummary>>(`/candidates${suffix}`);
  },
};
