"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { StatusDot } from "@/components/ui";
import { readMonitorCache, subscribeMonitorCache } from "@/lib/ops/monitor-cache";

export function MonitorStrip() {
  const cached = useSyncExternalStore(subscribeMonitorCache, readMonitorCache, () => null);
  const sites = cached?.sites ?? [];
  const summary =
    sites.length === 0 ? "Sites noch nicht geprüft" : `${sites.filter((site) => site.ok).length}/${sites.length} Sites live`;

  return (
    <Link
      href="/monitor"
      className="mb-6 flex items-center gap-3 overflow-x-auto rounded-lg border border-border px-4 py-2.5"
    >
      <span className="shrink-0 text-[12px] text-muted">{summary}</span>
      <span className="flex gap-1.5">
        {sites.length === 0
          ? Array.from({ length: 8 }).map((_, index) => <StatusDot key={index} tone="neutral" />)
          : sites.map((site) => (
              <StatusDot
                key={site.slug}
                tone={site.note === "up" ? "success" : site.note === "protected" ? "warning" : "danger"}
              />
            ))}
      </span>
    </Link>
  );
}
