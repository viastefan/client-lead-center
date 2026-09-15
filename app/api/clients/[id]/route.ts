import { randomUUID } from "node:crypto";
import { ApiError, jsonError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/api/require-user";
import { canAccessCustomer } from "@/lib/auth/session";
import { getCustomer } from "@/lib/services/customers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const requestId = randomUUID();
  try {
    const { user, supabase } = await requireApiUser();
    const { id } = await context.params;
    if (!canAccessCustomer(user, id)) {
      throw new ApiError(404, "NOT_FOUND", "Customer not found.");
    }
    const customer = await getCustomer(supabase, id);
    if (!customer) {
      throw new ApiError(404, "NOT_FOUND", "Customer not found.");
    }
    return Response.json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonError(error, requestId);
    }
    return jsonError(new ApiError(500, "INTERNAL_ERROR", "Customer could not be loaded."), requestId);
  }
}
