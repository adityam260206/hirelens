export type ParseStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type ParsedResumeData = {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: string[];
  education: Array<{ institution: string; degree: string; fieldOfStudy?: string | null }>;
  experience: Array<{ company: string; title: string; startDate: string; endDate?: string | null }>;
  projects: Array<{ name: string; description?: string | null; technologies: string[] }>;
  certifications: Array<{ name: string; issuer?: string | null; year?: number | null }>;
  languages: string[];
};

export type Resume = {
  id: string;
  candidateId: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  parseStatus: ParseStatus;
  parseError: string | null;
  parsedData: ParsedResumeData | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
