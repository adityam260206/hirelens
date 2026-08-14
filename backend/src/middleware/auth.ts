import { prisma } from "../config/db";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { verifyToken } from "../utils/jwt";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[env.COOKIE_NAME] as string | undefined;
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired session");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, companyId: true, isActive: true },
  });

  if (!user || !user.isActive) throw ApiError.unauthorized("Invalid or expired session");

  req.user = { id: user.id, role: user.role, companyId: user.companyId };
  next();
});

// Populates req.user when a valid session cookie is present, but never rejects
// the request otherwise. Useful for routes that behave differently for logged
// in vs. anonymous users (e.g. public job listings).
export const attachUserIfPresent = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[env.COOKIE_NAME] as string | undefined;
  if (!token) return next();

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, companyId: true, isActive: true },
    });
    if (user && user.isActive) {
      req.user = { id: user.id, role: user.role, companyId: user.companyId };
    }
  } catch {
    // Invalid/expired token on an optional-auth route — proceed anonymously.
  }

  next();
});
