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
      description="Die letzten Angebote und Rechnungen."
      action={
        <Link href="/quotes" className="text-sm text-muted hover:text-foreground">
          Alle
        </Link>
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Noch keine Dokumente.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <EntityMark name={doc.customerName || kindLabel(doc.kind)} size="sm" />
              <Link href={`${kindHref(doc.kind)}/${doc.id}`} className="min-w-0 flex-1 hover:underline">
                <span className="block truncate text-sm font-medium">
                  {doc.number || "Entwurf"} · {doc.customerName || "Ohne Kunde"}
                </span>
                <span className="block text-xs text-muted">{kindLabel(doc.kind)}</span>
              </Link>
              <StatusBadge tone={statusTone(doc.status)}>{statusLabel(doc.status)}</StatusBadge>
              <span className="hidden w-24 text-right text-sm tabular-nums sm:block">
                {formatMoney(documentTotals(doc).gross, doc.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
