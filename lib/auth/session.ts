import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Profile, SessionUser, UserRole } from "@/types";
import { isPreviewMode, previewUser } from "@/lib/data/workspace";

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data: claimsData, error } = await supabase.auth.getClaims();
    if (error || !claimsData?.claims) {
      return null;
    }

    const userId = String(claimsData.claims.sub ?? "");
    const email =
      typeof claimsData.claims.email === "string" ? claimsData.claims.email : null;

    if (!userId) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, customer_id, full_name, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle();

    return {
      id: userId,
      email,
      profile: (profile as Profile | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  if (isPreviewMode()) {
    return previewUser();
  }
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === "super_admin" || role === "admin";
}

export function canAccessCustomer(
  user: SessionUser,
  customerId: string,
): boolean {
  const role = user.profile?.role;
  if (isAdminRole(role)) {
    return true;
  }
  return user.profile?.customer_id === customerId;
}

export function assertCustomerAccess(user: SessionUser, customerId: string) {
  if (!canAccessCustomer(user, customerId)) {
    throw new AccessDeniedError();
  }
}

export class AccessDeniedError extends Error {
  constructor() {
    super("Kein Zugriff auf diese Kundendaten.");
    this.name = "AccessDeniedError";
  }
}
