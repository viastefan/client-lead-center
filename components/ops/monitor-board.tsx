"use client";

import { useState, useSyncExternalStore } from "react";
import { StatusBadge, StatusDot } from "@/components/ui";
import { writeMonitorCache, readMonitorCache, subscribeMonitorCache } from "@/lib/ops/monitor-cache";
import { logOpsEvent } from "@/lib/ops/events";
import type { SiteProbe } from "@/lib/ops/monitor";
import type { HealthComponentStatus, SystemHealth } from "@/types";

function noteTone(note: SiteProbe["note"]): "success" | "warning" | "danger" | "neutral" {
  if (note === "up") return "success";
  if (note === "protected") return "warning";
  if (note === "timeout" || note === "down") return "danger";
  return "neutral";
}

function noteLabel(note: SiteProbe["note"]) {
  if (note === "up") return "Live";
  if (note === "protected") return "Auth";
  if (note === "timeout") return "Timeout";
  return "Down";
}

function healthTone(status: HealthComponentStatus): "success" | "warning" | "danger" {
  if (status === "operational") return "success";
  if (status === "error") return "danger";
  return "warning";
}

function healthLabel(status: HealthComponentStatus) {
  if (status === "operational") return "Operational";
  if (status === "error") return "Error";
  return "Warning";
}

const SYSTEM_LABELS: Record<string, string> = {
  api: "API",
  database: "Database",
  storage: "Storage",
  email: "E-Mail",
  ai: "AI",
};

export function MonitorBoard({
  system,
}: {
  system: Array<{ label: string; ok: boolean; note: string }>;
}) {
  const cached = useSyncExternalStore(subscribeMonitorCache, readMonitorCache, () => null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const sites = cached?.sites ?? [];
  const healthRows = cached?.health?.components
    ? Object.entries(cached.health.components).map(([key, value]) => ({
        label: SYSTEM_LABELS[key] ?? key,
        status: value,
      }))
    : system.map((item) => ({
        label: item.label,
        status: (item.ok ? "operational" : "warning") as HealthComponentStatus,
      }));

  async function run() {
    setBusy(true);
    setStatus("Prüfe…");
    try {
      const [sitesResponse, healthResponse] = await Promise.all([
        fetch("/api/monitor/sites", { method: "POST" }),
        fetch("/api/health"),
      ]);
      const body = (await sitesResponse.json()) as {
        success?: boolean;
        error?: { message?: string };
        checkedAt?: string;
        up?: number;
        total?: number;
        sites?: SiteProbe[];
      };
      if (!sitesResponse.ok || !body.sites) {
        setStatus(body.error?.message || "Fehler");
        return;
      }
      let health: SystemHealth | undefined;
      if (healthResponse.ok) {
        health = (await healthResponse.json()) as SystemHealth;
      }
      writeMonitorCache({
        checkedAt: body.checkedAt ?? new Date().toISOString(),
        up: body.up ?? body.sites.filter((site) => site.ok).length,
        total: body.total ?? body.sites.length,
        sites: body.sites,
        health: health
          ? { status: health.status, timestamp: health.timestamp, components: health.components }
          : undefined,
      });
      logOpsEvent({
        title: `${body.up}/${body.total} Sites geprüft`,
        href: "/monitor",
      });
      setStatus(`${body.up}/${body.total} erreichbar`);
    } catch {
      setStatus("Prüfung fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-[13px] font-medium">Live-Sites</p>
            <p className="mt-0.5 text-[12px] text-muted">HEAD/GET auf die acht produktiven Domains.</p>
          </div>
          <button type="button" className="btn-primary" disabled={busy} onClick={() => void run()}>
            {busy ? "Prüfe…" : "Prüfen"}
          </button>
        </div>
        {status ? <p className="border-b border-border px-4 py-2 text-[12px] text-muted">{status}</p> : null}
        <ul>
          {sites.length === 0 ? (
            <li className="px-4 py-8 text-[13px] text-muted">Noch nicht geprüft. Ein Klick scannt alle Sites.</li>
          ) : (
            sites.map((site) => (
              <li key={site.slug} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
                <StatusDot tone={noteTone(site.note)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px]">{site.companyName}</p>
                  <p className="truncate text-[12px] text-muted">{site.domain}</p>
                </div>
                <span className="text-[12px] tabular-nums text-subtle">{site.ms} ms</span>
                <StatusBadge tone={noteTone(site.note)}>{noteLabel(site.note)}</StatusBadge>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="overflow-hidden rounded-lg border border-border">
        <div className="border-b border-border px-4 py-3">
          <p className="text-[13px] font-medium">Systeme</p>
        </div>
        <ul>
          {healthRows.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 last:border-0">
              <span className="flex items-center gap-2 text-[13px]">
                <StatusDot tone={healthTone(item.status)} />
                {item.label}
              </span>
              <StatusBadge tone={healthTone(item.status)}>{healthLabel(item.status)}</StatusBadge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
