"use client";

import Link from "next/link";
import { EntityMark } from "@/components/entity-mark";
import { Panel, StatusBadge } from "@/components/ui";
import { documentTotals } from "@/lib/billing/calc";
import { formatMoney } from "@/lib/billing/format";
import { kindHref, kindLabel, statusLabel, statusTone } from "@/lib/billing/labels";
import { useBilling } from "@/lib/billing/store";

export function RecentDocuments() {
  const { documents, ready } = useBilling();
  if (!ready) return null;

  const rows = documents.filter((doc) => !doc.archivedAt).slice(0, 6);

  return (
    <Panel
      title="Dokumente"
      description="Die letzten Angebote, Rechnungen und Verträge."
      action={
        <Link href="/quotes" className="text-[12px] text-muted hover:text-foreground">
          Alle
        </Link>
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Noch keine Dokumente.</p>
      ) : (
        <ul>
          {rows.map((doc) => (
            <li key={doc.id} className="border-b border-border last:border-0">
              <Link href={`${kindHref(doc.kind)}/${doc.id}`} className="row rounded-none px-0">
                <EntityMark name={doc.customerName || kindLabel(doc.kind)} size="sm" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                  {doc.number || "Entwurf"} · {doc.customerName || "Ohne Kunde"}
                </span>
                <StatusBadge tone={statusTone(doc.status)}>{statusLabel(doc.status)}</StatusBadge>
                <span className="hidden w-24 text-right text-[13px] tabular-nums sm:block">
                  {formatMoney(documentTotals(doc).gross, doc.currency)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
