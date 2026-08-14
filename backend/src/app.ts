import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env, isProduction } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { healthRouter } from "./modules/health/health.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { companiesRouter } from "./modules/companies/companies.routes";
import { jobsRouter } from "./modules/jobs/jobs.routes";
import { candidatesRouter } from "./modules/candidates/candidates.routes";
import { applicationsRouter } from "./modules/applications/applications.routes";
import { resumesRouter } from "./modules/resumes/resumes.routes";
import { teamRouter } from "./modules/users/users.routes";
import { interviewsRouter } from "./modules/interviews/interviews.routes";
import { feedbackRouter } from "./modules/feedback/feedback.routes";
import { offersRouter } from "./modules/offers/offers.routes";
import { analyticsRouter } from "./modules/analytics/analytics.routes";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(morgan(isProduction ? "combined" : "dev"));

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(cookieParser());

  const apiLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter);

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/companies", companiesRouter);
  app.use("/api/v1/jobs", jobsRouter);
  app.use("/api/v1/candidates", candidatesRouter);
  app.use("/api/v1/applications", applicationsRouter);
  app.use("/api/v1/resumes", resumesRouter);
  app.use("/api/v1/team", teamRouter);
  app.use("/api/v1/interviews", interviewsRouter);
  app.use("/api/v1/feedback", feedbackRouter);
  app.use("/api/v1/offers", offersRouter);
  app.use("/api/v1/analytics", analyticsRouter);

  // Additional /api/v1/* module routers are mounted here as they're built
  // (notifications).

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
