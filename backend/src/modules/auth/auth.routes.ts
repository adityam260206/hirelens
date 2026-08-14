import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middleware/auth";
import { login, logout, me, register } from "./auth.controller";

export const authRouter = Router();

// Stricter limiter on credential endpoints to slow down brute-force / credential
// stuffing attempts beyond the general API rate limit.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many attempts, please try again later" },
  },
});

authRouter.post("/register", authLimiter, register);
authRouter.post("/login", authLimiter, login);
authRouter.post("/logout", requireAuth, logout);
authRouter.get("/me", requireAuth, me);
