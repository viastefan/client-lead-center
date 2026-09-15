import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateWebsite, readJsonBody } from "@/lib/api/website-auth";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { ApiError, jsonError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";
import { ingestWebsiteLead } from "@/lib/services/ingest-lead";
import { createLeadSchema } from "@/lib/validations";
import { canAccessCustomer, getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listLeads } from "@/lib/services/leads";
import type { LeadStatus } from "@/types";

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  try {
    if (!isSupabaseAdminConfigured()) {
      throw new ApiError(500, "INTERNAL_ERROR", "Lead API is not configured.");
    }

    const body = await readJsonBody(request);
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "BAD_REQUEST", "Invalid lead payload.", parsed.error.flatten());
    }

    const website = await authenticateWebsite(
      request,
      parsed.data.customerId,
      parsed.data.websiteId,
    );

    await enforceRateLimit(website.id);

    const supabase = createAdminClient();
    const lead = await ingestWebsiteLead(
      supabase,
      parsed.data,
      website.id,
      website.customer_id,
    );

    logger.info("lead.created", {
      requestId,
      leadId: lead.id,
      customerId: website.customer_id,
      websiteId: website.id,
    });

    return Response.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn("lead.api_error", { requestId, code: error.code, message: error.message });
      return jsonError(error, requestId);
    }
    logger.error("lead.api_unhandled", {
      requestId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return jsonError(
      new ApiError(500, "INTERNAL_ERROR", "The lead could not be stored."),
      requestId,
    );
  }
}

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required.");
    }
    const supabase = await createClient();
    const customerId = request.nextUrl.searchParams.get("customerId") ?? undefined;
    if (customerId && !canAccessCustomer(user, customerId)) {
      throw new ApiError(401, "UNAUTHORIZED", "No access to this customer.");
    }

    const statusParam = request.nextUrl.searchParams.get("status");
    const leads = await listLeads(supabase, {
      customerId,
      status: (statusParam as LeadStatus | "all" | null) ?? "all",
      query: request.nextUrl.searchParams.get("q") ?? undefined,
    });

    return Response.json({ success: true, data: leads });
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonError(error, requestId);
    }
    logger.error("leads.list_failed", {
      requestId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return jsonError(new ApiError(500, "INTERNAL_ERROR", "Leads could not be loaded."), requestId);
  }
}
