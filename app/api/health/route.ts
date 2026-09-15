import {
  hasClaudeKey,
  hasGoogleOAuth,
  hasMicrosoftOAuth,
  hasResendKey,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import { storage } from "@/lib/storage";
import type { HealthComponentStatus, SystemHealth } from "@/types";

export const dynamic = "force-dynamic";

function fromBoolean(ok: boolean, missingIsWarning = true): HealthComponentStatus {
  if (ok) return "operational";
  return missingIsWarning ? "warning" : "error";
}

export async function GET() {
  const timestamp = new Date().toISOString();
  let database: SystemHealth["database"] = "unconfigured";
  let databaseComponent: HealthComponentStatus = "warning";

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
      const supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await supabase.rpc("health_ping");
      if (error) {
        database = "disconnected";
        databaseComponent = "error";
      } else {
        database = "connected";
        databaseComponent = "operational";
      }
    } catch {
      database = "disconnected";
      databaseComponent = "error";
    }
  }

  let storageStatus: HealthComponentStatus = "warning";
  if (isSupabaseAdminConfigured()) {
    storageStatus = (await storage.ping()) ? "operational" : "error";
  }

  const emailConfigured = hasResendKey() || hasGoogleOAuth() || hasMicrosoftOAuth();
  const components = {
    api: "operational" as HealthComponentStatus,
    database: databaseComponent,
    storage: storageStatus,
    email: fromBoolean(emailConfigured),
    ai: fromBoolean(hasClaudeKey()),
  };

  const hasError = Object.values(components).some((value) => value === "error");
  const hasWarning = Object.values(components).some((value) => value === "warning");

  const payload: SystemHealth = {
    status: hasError ? "error" : hasWarning ? "degraded" : "ok",
    database,
    timestamp,
    components,
  };

  return Response.json(payload, { status: hasError ? 503 : 200 });
}
