import type { NextRequest } from "next/server";
import { hashesMatch } from "@/lib/crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/api/errors";
import { domainHost } from "@/lib/format";
import type { Website } from "@/types";

const MAX_BODY_BYTES = 32 * 1024;

export function assertPayloadSize(request: NextRequest) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) {
    throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
  }
}

export async function readJsonBody(request: NextRequest): Promise<unknown> {
  assertPayloadSize(request);
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, "BAD_REQUEST", "Invalid JSON body.");
  }
}

export function getApiKey(request: NextRequest): string {
  const header = request.headers.get("x-api-key")?.trim();
  if (!header) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing API key.");
  }
  return header;
}

export async function authenticateWebsite(
  request: NextRequest,
  customerId: string,
  websiteId: string,
): Promise<Website> {
  const apiKey = getApiKey(request);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("websites")
    .select(
      "id, customer_id, name, domain, status, active, api_key_hash, last_request_at, last_lead_at, created_at, updated_at",
    )
    .eq("id", websiteId)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "INTERNAL_ERROR", "Website lookup failed.");
  }
  if (!data) {
    throw new ApiError(404, "NOT_FOUND", "Website not found.");
  }

  const website = data as Website;
  if (!hashesMatch(website.api_key_hash, apiKey)) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid API key.");
  }
  if (website.customer_id !== customerId) {
    throw new ApiError(401, "UNAUTHORIZED", "Website does not belong to this customer.");
  }
  if (!website.active || website.status !== "active") {
    throw new ApiError(401, "UNAUTHORIZED", "Website is not active.");
  }

  assertOrigin(request, website.domain);
  return website;
}

function assertOrigin(request: NextRequest, domain: string) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (!origin && !referer) {
    return;
  }

  const allowedHost = domainHost(domain).toLowerCase();
  const hosts = [origin, referer]
    .filter((value): value is string => Boolean(value))
    .map((value) => {
      try {
        return new URL(value).hostname.toLowerCase();
      } catch {
        return "";
      }
    });

  const ok = hosts.some(
    (host) =>
      host === allowedHost ||
      host.endsWith(`.${allowedHost}`) ||
      allowedHost.endsWith(`.${host}`),
  );

  if (!ok) {
    throw new ApiError(401, "UNAUTHORIZED", "Origin is not allowed for this website.");
  }
}
