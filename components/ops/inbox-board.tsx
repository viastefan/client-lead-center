"use client";

import { useMemo } from "react";
import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge, StatusDot } from "@/components/ui";
import { useBilling } from "@/lib/billing/store";
import { buildInbox, inboxKindLabel, type InboxLead } from "@/lib/ops/inbox";

function toneDot(tone: "danger" | "warning" | "neutral") {
  if (tone === "danger") return "danger" as const;
  if (tone === "warning") return "warning" as const;
  return "neutral" as const;
}

export function InboxBoard({ leads }: { leads: InboxLead[] }) {
  const { ready, documents, reminders } = useBilling();
  const rows = useMemo(
    () => (ready ? buildInbox({ documents, reminders, leads }) : []),
    [documents, leads, ready, reminders],
  );

  if (!ready) return <div className="glass h-40 animate-pulse rounded-lg" />;

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Alles, das jetzt Aufmerksamkeit braucht: Leads, Zahlungen, Angebote, Verträge."
      />
      {rows.length === 0 ? (
        <EmptyState title="Alles ruhig" description="Keine offenen Leads oder Erinnerungen." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {rows.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="row rounded-none">
                <StatusDot tone={toneDot(item.tone)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{item.title}</p>
                  <p className="truncate text-[12px] text-muted">{item.subtitle}</p>
                </div>
                <StatusBadge tone={item.tone}>{inboxKindLabel(item.kind)}</StatusBadge>
                <span className="hidden text-[12px] text-subtle sm:block">{item.dueDate}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
