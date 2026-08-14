import { apiClient } from "@/lib/api-client";
import type { CreateJobPayload, JobCard, JobDetail, JobListQuery, Paginated } from "@/types/job";

function toQueryString(query: JobListQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const jobsService = {
  list: (query?: JobListQuery) => apiClient.get<Paginated<JobCard>>(`/jobs${toQueryString(query)}`),
  get: (id: string) => apiClient.get<JobDetail>(`/jobs/${id}`),
  create: (payload: CreateJobPayload) => apiClient.post<JobDetail>("/jobs", payload),
  update: (id: string, payload: Partial<CreateJobPayload>) =>
    apiClient.patch<JobDetail>(`/jobs/${id}`, payload),
  publish: (id: string) => apiClient.post<JobDetail>(`/jobs/${id}/publish`),
  close: (id: string) => apiClient.post<JobDetail>(`/jobs/${id}/close`),
  remove: (id: string) => apiClient.delete<void>(`/jobs/${id}`),
};
