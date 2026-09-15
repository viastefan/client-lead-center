import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditLog } from "@/types";

export async function writeAuditLog(
  supabase: SupabaseClient,
  entry: {
    userId?: string | null;
    customerId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown> | null;
  },
) {
  const { error } = await supabase.from("audit_logs").insert({
    user_id: entry.userId ?? null,
    customer_id: entry.customerId ?? null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    metadata: entry.metadata ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function listRecentAuditLogs(
  supabase: SupabaseClient,
  limit = 8,
): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, user_id, customer_id, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as AuditLog[];
}
