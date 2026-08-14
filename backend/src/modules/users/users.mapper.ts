import type { User } from "@prisma/client";

export function toSafeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    companyId: user.companyId,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export type SafeUser = ReturnType<typeof toSafeUser>;
