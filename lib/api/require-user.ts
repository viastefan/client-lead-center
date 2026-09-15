import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";
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
