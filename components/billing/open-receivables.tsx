"use client";

import Link from "next/link";
import { Panel, StatusBadge } from "@/components/ui";
import { documentTotals, isOpenReceivable, isOverdueInvoice } from "@/lib/billing/calc";
import { formatMoney } from "@/lib/billing/format";
import { statusLabel, statusTone } from "@/lib/billing/labels";
import { useBilling } from "@/lib/billing/store";

export function OpenReceivables() {
  const { documents, ready } = useBilling();
  if (!ready) return null;
  const rows = documents
    .filter((doc) => isOpenReceivable(doc))
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
    .slice(0, 6);

  return (
    <Panel
      title="Offene Rechnungen"
      description="Fällig, überfällig oder noch Entwurf."
      action={
        <Link href="/invoices" className="text-[12px] text-muted hover:text-foreground">
          Alle
        </Link>
      }
    >
      {rows.length === 0 ? (
        <p className="text-[13px] text-muted">Keine offenen Beträge.</p>
      ) : (
        <ul>
          {rows.map((doc) => {
            const overdue = isOverdueInvoice(doc);
            return (
              <li key={doc.id} className="border-b border-border last:border-0">
                <Link href={`/invoices/${doc.id}`} className="row rounded-none px-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">
                      {doc.number || "Entwurf"} · {doc.customerName || "Empfänger"}
                    </p>
                    <p className="text-[12px] text-muted">{doc.dueDate ? `Fällig ${doc.dueDate}` : "Ohne Datum"}</p>
                  </div>
                  <StatusBadge tone={overdue ? "danger" : statusTone(doc.status)}>
                    {overdue ? "Überfällig" : statusLabel(doc.status)}
                  </StatusBadge>
                  <span className="w-24 text-right text-[13px] tabular-nums">
                    {formatMoney(documentTotals(doc).gross, doc.currency)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
