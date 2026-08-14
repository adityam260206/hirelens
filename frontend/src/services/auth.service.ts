import { apiClient } from "@/lib/api-client";
import type { CurrentUser, RegisteredUser, UserRole } from "@/types/user";

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Extract<UserRole, "CANDIDATE" | "RECRUITER">;
  companyName?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export const authService = {
  register: (payload: RegisterPayload) => apiClient.post<RegisteredUser>("/auth/register", payload),
  login: (payload: LoginPayload) => apiClient.post<RegisteredUser>("/auth/login", payload),
  logout: () => apiClient.post<void>("/auth/logout"),
  me: () => apiClient.get<CurrentUser>("/auth/me"),
};
