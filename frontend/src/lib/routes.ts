import type { UserRole } from "@/types/user";

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case "CANDIDATE":
      return "/candidate";
    case "RECRUITER":
      return "/recruiter";
    case "INTERVIEWER":
      return "/interviewer";
  }
}
