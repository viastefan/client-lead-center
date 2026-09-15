import { randomUUID } from "node:crypto";
import { ApiError, jsonError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/api/require-user";
import { isAdminRole } from "@/lib/auth/session";
import { createWebsite, listWebsites } from "@/lib/services/websites";
import { websiteInputSchema } from "@/lib/validations";
import { writeAuditLog } from "@/lib/services/audit";

export async function GET() {
  const requestId = randomUUID();
  try {
    const { supabase } = await requireApiUser();
    const websites = await listWebsites(supabase);
    return Response.json({ success: true, data: websites });
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonError(error, requestId);
    }
    return jsonError(new ApiError(500, "INTERNAL_ERROR", "Websites could not be loaded."), requestId);
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const { user, supabase } = await requireApiUser();
    if (!isAdminRole(user.profile?.role)) {
      throw new ApiError(401, "UNAUTHORIZED", "Admin access required.");
    }
    const parsed = websiteInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(400, "BAD_REQUEST", "Invalid website payload.", parsed.error.flatten());
    }
    const { website, apiKey } = await createWebsite(supabase, parsed.data);
    await writeAuditLog(supabase, {
      userId: user.id,
      customerId: website.customer_id,
      action: "website.created",
      entityType: "website",
      entityId: website.id,
    });
    return Response.json(
      {
        success: true,
        data: { website, apiKey },
        warning: "Store this API key now. It cannot be shown again.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonError(error, requestId);
    }
    return jsonError(new ApiError(500, "INTERNAL_ERROR", "Website could not be created."), requestId);
  }
}
