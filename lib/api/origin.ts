import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) {
    throw new ApiError(403, "FORBIDDEN", "Missing origin.");
  }
  const host = request.headers.get("host") ?? "";
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ApiError(403, "FORBIDDEN", "Invalid origin.");
  }
  if (originHost !== host) {
    throw new ApiError(403, "FORBIDDEN", "Origin is not allowed.");
  }
}

const hits = new Map<string, { count: number; resetAt: number }>();

export function enforceMemoryRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= max) {
    throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please retry later.");
  }
  current.count += 1;
}
