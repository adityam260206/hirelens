export type AnalyticsOverview = {
  totalApplications: number;
  activeJobs: number;
  candidatesShortlisted: number;
  interviews: number;
  offers: number;
  hires: number;
  offerAcceptanceRate: number | null;
  avgTimeToHireDays: number | null;
};

export type FunnelStage = {
  status: string;
  count: number;
};
