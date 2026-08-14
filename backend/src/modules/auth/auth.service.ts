import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { comparePassword, hashPassword } from "../../utils/password";
import { toSafeUser, type SafeUser } from "../users/users.mapper";
import type { LoginInput, RegisterInput } from "./auth.schemas";

export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    let companyId: string | undefined;
    if (input.role === "RECRUITER") {
      const company = await tx.company.create({ data: { name: input.companyName! } });
      companyId = company.id;
    }

    const createdUser = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        companyId,
      },
    });

    if (input.role === "CANDIDATE") {
      await tx.candidate.create({ data: { userId: createdUser.id } });
    }

    return createdUser;
  });

  return toSafeUser(user);
}

export async function authenticateUser(input: LoginInput): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.isActive) throw ApiError.unauthorized("Invalid email or password");

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  return toSafeUser(user);
}

export async function getCurrentUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true, logoUrl: true } },
      candidate: { select: { id: true, profileCompletion: true } },
    },
  });
  if (!user) throw ApiError.notFound("User not found");

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
