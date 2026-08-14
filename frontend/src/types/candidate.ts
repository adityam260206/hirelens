export type CandidateProfile = {
  id: string;
  userId: string;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: string[];
  education: unknown;
  experience: unknown;
  projects: unknown;
  certifications: unknown;
  languages: string[];
  profileCompletion: number;
  createdAt: string;
  updatedAt: string;
  user: { firstName: string; lastName: string; email: string };
};

export type CandidateSummary = {
  id: string;
  phone: string | null;
  location: string | null;
  skills: string[];
  profileCompletion: number;
  updatedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
};

export type UpdateCandidateProfilePayload = {
  phone?: string;
  location?: string;
  summary?: string;
  skills?: string[];
  languages?: string[];
};
