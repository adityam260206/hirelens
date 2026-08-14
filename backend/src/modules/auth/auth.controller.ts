import type { Response } from "express";
import { env, isProduction } from "../../config/env";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, noContent, ok } from "../../utils/apiResponse";
import { logActivity } from "../../utils/activityLog";
import { signToken } from "../../utils/jwt";
import { loginSchema, registerSchema } from "./auth.schemas";
import { authenticateUser, getCurrentUser, registerUser } from "./auth.service";

const SESSION_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setSessionCookie(res: Response, userId: string, role: Parameters<typeof signToken>[0]["role"]) {
  const token = signToken({ sub: userId, role });
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

export const register = asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const user = await registerUser(input);

  setSessionCookie(res, user.id, user.role);
  await logActivity({
    userId: user.id,
    action: "USER_REGISTERED",
    entityType: "User",
    entityId: user.id,
    ipAddress: req.ip,
  });

  return created(res, user);
});

export const login = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await authenticateUser(input);

  setSessionCookie(res, user.id, user.role);
  await logActivity({
    userId: user.id,
    action: "USER_LOGIN",
    entityType: "User",
    entityId: user.id,
    ipAddress: req.ip,
  });

  return ok(res, user);
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.COOKIE_NAME, { path: "/" });

  if (req.user) {
    await logActivity({
      userId: req.user.id,
      action: "USER_LOGOUT",
      entityType: "User",
      entityId: req.user.id,
      ipAddress: req.ip,
    });
  }

  return noContent(res);
});

export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user!.id);
  return ok(res, user);
});
