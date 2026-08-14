import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";
import { logger } from "./utils/logger";

async function main() {
  await prisma.$connect();
  logger.info("Database connected");

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`HireLens API listening on http://localhost:${env.PORT}`, {
      env: env.NODE_ENV,
    });
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error("Failed to start server", { message: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
