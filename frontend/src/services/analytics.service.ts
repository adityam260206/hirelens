import { apiClient } from "@/lib/api-client";
import type { AnalyticsOverview, FunnelStage } from "@/types/analytics";

export const analyticsService = {
  overview: () => apiClient.get<AnalyticsOverview>("/analytics/overview"),
  funnel: () => apiClient.get<FunnelStage[]>("/analytics/funnel"),
};
