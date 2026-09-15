import { randomUUID } from "node:crypto";
import { ApiError, jsonError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/api/require-user";
import { canAccessCustomer, isAdminRole } from "@/lib/auth/session";
import { getWebsite, rotateWebsiteApiKey } from "@/lib/services/websites";
import { writeAuditLog } from "@/lib/services/audit";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const requestId = randomUUID();
  try {
    const { user, supabase } = await requireApiUser();
    if (!isAdminRole(user.profile?.role)) {
      throw new ApiError(401, "UNAUTHORIZED", "Admin access required.");
    }
    const { id } = await context.params;
    const website = await getWebsite(supabase, id);
    if (!website || !canAccessCustomer(user, website.customer_id)) {
      throw new ApiError(404, "NOT_FOUND", "Website not found.");
    }
    const apiKey = await rotateWebsiteApiKey(supabase, website.id, website.customer_id);
    await writeAuditLog(supabase, {
      userId: user.id,
      customerId: website.customer_id,
      action: "website.api_key_rotated",
      entityType: "website",
      entityId: website.id,
    });
    return Response.json({
      success: true,
      apiKey,
      warning: "Store this API key now. It cannot be shown again.",
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonError(error, requestId);
    }
    return jsonError(new ApiError(500, "INTERNAL_ERROR", "API key could not be rotated."), requestId);
  }
}
