export type UserRole = "CANDIDATE" | "RECRUITER" | "INTERVIEWER";

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company: { id: string; name: string; logoUrl: string | null } | null;
  candidate: { id: string; profileCompletion: number } | null;
};

export type RegisteredUser = Pick<
  CurrentUser,
  "id" | "email" | "firstName" | "lastName" | "role" | "companyId" | "isActive" | "createdAt"
>;
