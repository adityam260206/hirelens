import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    FRONTEND_URL: z.string().url(),

    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    COOKIE_NAME: z.string().default("hirelens_session"),

    AI_PROVIDER: z.enum(["anthropic", "mock"]).default("anthropic"),
    ANTHROPIC_API_KEY: z.string().optional().default(""),
    ANTHROPIC_MODEL: z.string().default("claude-sonnet-5"),

    STORAGE_DRIVER: z.enum(["local", "cloudinary"]).default("local"),
    LOCAL_STORAGE_DIR: z.string().default("./uploads"),
    CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
    CLOUDINARY_API_KEY: z.string().optional().default(""),
    CLOUDINARY_API_SECRET: z.string().optional().default(""),

    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      if (!data.ANTHROPIC_API_KEY && data.AI_PROVIDER === "anthropic") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ANTHROPIC_API_KEY"],
          message: "ANTHROPIC_API_KEY is required in production when AI_PROVIDER=anthropic",
        });
      }
      if (data.STORAGE_DRIVER === "cloudinary" && !data.CLOUDINARY_API_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CLOUDINARY_API_SECRET"],
          message: "CLOUDINARY_API_SECRET is required in production when STORAGE_DRIVER=cloudinary",
        });
      }
    }
  });

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment configuration:");
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === "production";
export const isAiMocked = env.AI_PROVIDER === "mock" || env.ANTHROPIC_API_KEY.length === 0;
