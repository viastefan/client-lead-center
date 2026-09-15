import { randomUUID } from "node:crypto";
import { ApiError, jsonError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/api/require-user";
import { canAccessCustomer } from "@/lib/auth/session";
import { getLead, updateLead } from "@/lib/services/leads";
import { leadPatchSchema } from "@/lib/validations";
import { writeAuditLog } from "@/lib/services/audit";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const requestId = randomUUID();
  try {
    const { user, supabase } = await requireApiUser();
    const { id } = await context.params;
    const scopedCustomerId = user.profile?.role === "client" ? user.profile.customer_id ?? undefined : undefined;
    const lead = await getLead(supabase, id, scopedCustomerId);

    if (!lead || !canAccessCustomer(user, lead.customer_id)) {
      throw new ApiError(404, "NOT_FOUND", "Lead not found.");
    }

    return Response.json({ success: true, data: lead });
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonError(error, requestId);
    }
    return jsonError(new ApiError(500, "INTERNAL_ERROR", "Lead could not be loaded."), requestId);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = randomUUID();
  try {
    const { user, supabase } = await requireApiUser();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = leadPatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "BAD_REQUEST", "Invalid lead update.", parsed.error.flatten());
    }

    const lead = await getLead(supabase, id);
    if (!lead || !canAccessCustomer(user, lead.customer_id)) {
      throw new ApiError(404, "NOT_FOUND", "Lead not found.");
    }

    await updateLead(supabase, id, lead.customer_id, parsed.data);
    await writeAuditLog(supabase, {
      userId: user.id,
      customerId: lead.customer_id,
      action: "lead.updated",
      entityType: "lead",
      entityId: id,
      metadata: parsed.data,
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonError(error, requestId);
    }
    return jsonError(new ApiError(500, "INTERNAL_ERROR", "Lead could not be updated."), requestId);
  }
}
