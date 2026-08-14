import { apiClient } from "@/lib/api-client";
import type { Resume } from "@/types/resume";

export const resumesService = {
  list: () => apiClient.get<Resume[]>("/resumes"),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.postForm<Resume>("/resumes", formData);
  },
  retryAnalysis: (id: string) => apiClient.post<Resume>(`/resumes/${id}/analyze`),
};
