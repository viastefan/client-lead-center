import { logger } from "@/lib/logger";

export async function register() {
  logger.info("runtime.ready", {
    region: process.env.VERCEL_REGION ?? "local",
    env: process.env.VERCEL_ENV ?? "development",
  });
}

export function onRequestError(
  error: { digest: string } & Error,
  request: { path: string; method: string },
) {
  logger.error("request.unhandled", {
    digest: error.digest,
    message: error.message,
    path: request.path,
    method: request.method,
  });
}
