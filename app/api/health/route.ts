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
  try {
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
          databaseComponent = "warning";
        } else {
          database = "connected";
          databaseComponent = "operational";
        }
      } catch {
        database = "disconnected";
        databaseComponent = "warning";
      }
    }

    let storageStatus: HealthComponentStatus = "warning";
    if (isSupabaseAdminConfigured()) {
      try {
        storageStatus = (await storage.ping()) ? "operational" : "warning";
      } catch {
        storageStatus = "warning";
      }
    }

    const emailConfigured = hasResendKey() || hasGoogleOAuth() || hasMicrosoftOAuth();
    const components = {
      api: "operational" as HealthComponentStatus,
      database: databaseComponent,
      storage: storageStatus,
      email: fromBoolean(emailConfigured),
      ai: fromBoolean(hasClaudeKey()),
    };

    const hasWarning = Object.values(components).some((value) => value === "warning");

    const payload: SystemHealth = {
      status: hasWarning ? "degraded" : "ok",
      database,
      timestamp,
      components,
    };

    return Response.json(payload, { status: 200 });
  } catch {
    return Response.json(
      {
        status: "degraded",
        database: "disconnected",
        timestamp: new Date().toISOString(),
        components: {
          api: "operational",
          database: "warning",
          storage: "warning",
          email: "warning",
          ai: "warning",
        },
      } satisfies SystemHealth,
      { status: 200 },
    );
  }
}
