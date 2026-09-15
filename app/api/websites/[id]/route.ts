import { randomUUID } from "node:crypto";
import { ApiError, jsonError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/api/require-user";
import { canAccessCustomer } from "@/lib/auth/session";
import { getWebsite } from "@/lib/services/websites";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const requestId = randomUUID();
  try {
    const { user, supabase } = await requireApiUser();
    const { id } = await context.params;
    const website = await getWebsite(supabase, id);
    if (!website || !canAccessCustomer(user, website.customer_id)) {
      throw new ApiError(404, "NOT_FOUND", "Website not found.");
    }
    return Response.json({
      success: true,
      data: {
        ...website,
        api_key_hash: undefined,
        apiKeyConfigured: Boolean(website.api_key_hash),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonError(error, requestId);
    }
    return jsonError(new ApiError(500, "INTERNAL_ERROR", "Website could not be loaded."), requestId);
  }
}
