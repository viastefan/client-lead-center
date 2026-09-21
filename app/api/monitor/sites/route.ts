import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { ApiError, jsonError } from "@/lib/api/errors";
import { assertSameOrigin, enforceMemoryRateLimit } from "@/lib/api/origin";
import { requireApiAdmin } from "@/lib/api/require-user";
import { logger } from "@/lib/logger";
import { probeCatalogSites } from "@/lib/ops/monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  try {
    assertSameOrigin(request);
    await requireApiAdmin();
    enforceMemoryRateLimit(`monitor-sites:${clientKey(request)}`, 10, 10 * 60 * 1000);
    const sites = await probeCatalogSites();
    const up = sites.filter((site) => site.ok).length;
    logger.info("monitor.sites", { requestId, up, total: sites.length });
    return Response.json({ success: true, checkedAt: new Date().toISOString(), up, total: sites.length, sites });
  } catch (error) {
    if (error instanceof ApiError) return jsonError(error, requestId);
    logger.error("monitor.sites_failed", {
      requestId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return jsonError(new ApiError(500, "INTERNAL_ERROR", "Monitoring fehlgeschlagen."), requestId);
  }
}
