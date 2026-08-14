import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { hashPassword } from "../../utils/password";
import { toSafeUser } from "./users.mapper";
import type { CreateInterviewerInput } from "./users.schemas";

export async function createInterviewer(companyId: string, input: CreateInterviewerInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: "INTERVIEWER",
      companyId,
    },
  });

  return toSafeUser(user);
}

export async function listInterviewers(companyId: string) {
  const users = await prisma.user.findMany({
    where: { companyId, role: "INTERVIEWER" },
    orderBy: { createdAt: "desc" },
  });
  return users.map(toSafeUser);
}
