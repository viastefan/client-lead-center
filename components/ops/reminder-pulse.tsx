"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useBilling } from "@/lib/billing/store";
import { derivedReminders, mergeReminders } from "@/lib/ops/reminders";

export function ReminderPulse() {
  const { documents, reminders, ready } = useBilling();
  const open = useMemo(
    () => mergeReminders(reminders, derivedReminders(documents)).filter((item) => item.status === "open"),
    [documents, reminders],
  );
  if (!ready || open.length === 0) return null;
  return (
    <div className="glass mb-6 rounded-lg px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">
          {open.length} offene Erinnerung{open.length === 1 ? "" : "en"}
        </p>
        <Link href="/reminders" className="text-sm text-muted hover:text-foreground">
          Alle
        </Link>
      </div>
    </div>
  );
}
