export type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "SHORTLISTED"
  | "TECHNICAL_INTERVIEW"
  | "HR_INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

import type { CandidateMatch } from "./match";
import type { Offer } from "./offer";

export type ApplicationDetail = {
  id: string;
  candidateId: string;
  jobId: string;
  resumeId: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    companyId: string;
    status: string;
    company: { id: string; name: string };
  };
  resume: { id: string; originalFilename: string; parseStatus: string };
  candidate: {
    id: string;
    user: { id: string; firstName: string; lastName: string; email: string };
  };
  match: CandidateMatch | null;
  offer: Offer | null;
};
