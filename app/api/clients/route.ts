import { randomUUID } from "node:crypto";
import { ApiError, jsonError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/api/require-user";
import { isAdminRole } from "@/lib/auth/session";
import { createCustomer, listCustomers } from "@/lib/services/customers";
import { customerInputSchema } from "@/lib/validations";
import { writeAuditLog } from "@/lib/services/audit";

export async function GET() {
  const requestId = randomUUID();
  try {
    const { supabase } = await requireApiUser();
    const customers = await listCustomers(supabase);
    return Response.json({ success: true, data: customers });
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonError(error, requestId);
    }
    return jsonError(new ApiError(500, "INTERNAL_ERROR", "Customers could not be loaded."), requestId);
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const { user, supabase } = await requireApiUser();
    if (!isAdminRole(user.profile?.role)) {
      throw new ApiError(401, "UNAUTHORIZED", "Admin access required.");
    }
    const parsed = customerInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(400, "BAD_REQUEST", "Invalid customer payload.", parsed.error.flatten());
    }
    const customer = await createCustomer(supabase, parsed.data);
    await writeAuditLog(supabase, {
      userId: user.id,
      customerId: customer.id,
      action: "customer.created",
      entityType: "customer",
      entityId: customer.id,
    });
    return Response.json({ success: true, data: customer }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonError(error, requestId);
    }
    return jsonError(new ApiError(500, "INTERNAL_ERROR", "Customer could not be created."), requestId);
  }
}
