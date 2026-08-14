import { apiClient } from "@/lib/api-client";
import type { CreateOfferPayload, Offer } from "@/types/offer";

export const offersService = {
  create: (applicationId: string, payload: CreateOfferPayload) =>
    apiClient.post<Offer>(`/applications/${applicationId}/offer`, payload),
  get: (id: string) => apiClient.get<Offer>(`/offers/${id}`),
  update: (id: string, payload: Partial<CreateOfferPayload>) => apiClient.patch<Offer>(`/offers/${id}`, payload),
  send: (id: string) => apiClient.post<Offer>(`/offers/${id}/send`),
  withdraw: (id: string) => apiClient.post<Offer>(`/offers/${id}/withdraw`),
  accept: (id: string) => apiClient.post<Offer>(`/offers/${id}/accept`),
  reject: (id: string) => apiClient.post<Offer>(`/offers/${id}/reject`),
};
