export type WorkMode = "REMOTE" | "ONSITE" | "HYBRID";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
export type JobStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export type JobCard = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  workMode: WorkMode;
  employmentType: EmploymentType;
  minExperience: number;
  maxExperience: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  requiredSkills: string[];
  preferredSkills: string[];
  status: JobStatus;
  deadline: string | null;
  publishedAt: string | null;
  createdAt: string;
  company: { id: string; name: string; logoUrl: string | null };
  _count: { applications: number };
};

export type JobDetail = JobCard & {
  description: string;
  education: string[];
  companyId: string;
  createdById: string;
  closedAt: string | null;
  updatedAt: string;
  company: JobCard["company"] & { website: string | null; description: string | null };
  requirement: {
    id: string;
    requiredSkills: string[];
    preferredSkills: string[];
    minimumExperience: number;
    education: string[];
    responsibilities: string[];
    roleKeywords: string[];
  } | null;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CreateJobPayload = {
  title: string;
  department?: string;
  description: string;
  location?: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  minExperience: number;
  maxExperience?: number;
  salaryMin?: number;
  salaryMax?: number;
  requiredSkills: string[];
  preferredSkills: string[];
  education: string[];
  deadline?: string;
};

export type JobListQuery = {
  scope?: "public" | "company";
  search?: string;
  status?: JobStatus;
  workMode?: WorkMode;
  location?: string;
  skill?: string;
  page?: number;
  pageSize?: number;
};
