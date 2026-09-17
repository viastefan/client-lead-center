import { ApiError } from "@/lib/api/errors";
import { isPreviewMode, previewUser } from "@/lib/data/workspace";
import { getSessionUser, isAdminRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function requireApiUser(): Promise<{
  user: SessionUser;
  supabase: SupabaseClient;
}> {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required.");
  }
  const supabase = await createClient();
  return { user, supabase };
}

export async function requireApiActor(): Promise<{
  user: SessionUser;
  supabase: SupabaseClient | null;
  preview: boolean;
}> {
  if (isPreviewMode()) {
    return { user: previewUser(), supabase: null, preview: true };
  }
  const { user, supabase } = await requireApiUser();
  return { user, supabase, preview: false };
}

export async function requireApiAdmin(): Promise<{
  user: SessionUser;
  supabase: SupabaseClient | null;
  preview: boolean;
}> {
  const actor = await requireApiActor();
  if (!isAdminRole(actor.user.profile?.role)) {
    throw new ApiError(403, "FORBIDDEN", "Admin access required.");
  }
  return actor;
}
