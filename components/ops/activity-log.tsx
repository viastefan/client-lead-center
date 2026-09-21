"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { readOpsEventsFromStorage, subscribeOpsEvents } from "@/lib/ops/events";

function formatStamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ActivityLog() {
  const events = useSyncExternalStore(subscribeOpsEvents, readOpsEventsFromStorage, () => []);
  const rows = events.slice(0, 8);

  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <div className="border-b border-border px-4 py-2.5">
        <p className="text-[13px] font-medium">Aktivität</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-5 text-[13px] text-muted">Noch keine lokalen Ereignisse in dieser Sitzung.</p>
      ) : (
        <ul>
          {rows.map((event) => (
            <li key={event.id} className="border-b border-border last:border-0">
              {event.href ? (
                <Link href={event.href} className="row rounded-none">
                  <span className="min-w-0 flex-1 truncate text-[13px]">{event.title}</span>
                  <span className="hidden text-[12px] text-subtle sm:block">{formatStamp(event.at)}</span>
                </Link>
              ) : (
                <div className="row rounded-none">
                  <span className="min-w-0 flex-1 truncate text-[13px]">{event.title}</span>
                  <span className="hidden text-[12px] text-subtle sm:block">{formatStamp(event.at)}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
