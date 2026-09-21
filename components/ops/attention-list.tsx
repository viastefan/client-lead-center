"use client";

import { useMemo } from "react";
import Link from "next/link";
import { StatusDot } from "@/components/ui";
import { useBilling } from "@/lib/billing/store";
import { buildInbox, type InboxLead } from "@/lib/ops/inbox";

export function AttentionList({ leads }: { leads: InboxLead[] }) {
  const { ready, documents, reminders } = useBilling();
  const rows = useMemo(
    () => (ready ? buildInbox({ documents, reminders, leads }).slice(0, 8) : []),
    [documents, leads, ready, reminders],
  );

  if (!ready) return <div className="glass h-32 animate-pulse rounded-lg" />;
  if (rows.length === 0) {
    return (
      <div className="glass rounded-lg px-4 py-5 text-[13px] text-muted">Nichts Offenes. Inbox ist leer.</div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <p className="text-[13px] font-medium">Jetzt</p>
        <Link href="/inbox" className="text-[12px] text-muted hover:text-foreground">
          Inbox
        </Link>
      </div>
      <ul>
        {rows.map((item) => (
          <li key={item.id} className="border-b border-border last:border-0">
            <Link href={item.href} className="row rounded-none">
              <StatusDot tone={item.tone === "danger" ? "danger" : item.tone === "warning" ? "warning" : "neutral"} />
              <span className="min-w-0 flex-1 truncate text-[13px]">{item.title}</span>
              <span className="hidden text-[12px] text-subtle sm:block">{item.dueDate}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
