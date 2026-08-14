import { apiClient } from "@/lib/api-client";
import type { ApplicationDetail, ApplicationStatus } from "@/types/application";
import type { Paginated } from "@/types/job";

export const applicationsService = {
  listMine: () => apiClient.get<Paginated<ApplicationDetail>>("/applications"),
  listForJob: (jobId: string) => apiClient.get<Paginated<ApplicationDetail>>(`/applications?jobId=${jobId}`),
  get: (id: string) => apiClient.get<ApplicationDetail>(`/applications/${id}`),
  updateStatus: (id: string, status: ApplicationStatus) =>
    apiClient.patch<ApplicationDetail>(`/applications/${id}/status`, { status }),
  apply: (jobId: string, resumeId: string) =>
    apiClient.post<ApplicationDetail>(`/jobs/${jobId}/applications`, { resumeId }),
};
