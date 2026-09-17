"use client";

import Link from "next/link";
import { documentTotals, isOpenReceivable } from "@/lib/billing/calc";
import { formatMoney } from "@/lib/billing/format";
import { useBilling } from "@/lib/billing/store";
import { StatCard } from "@/components/ui";

export function FinancePulse() {
  const { documents, ready } = useBilling();
  if (!ready) return null;

  const quotes = documents.filter((doc) => doc.kind === "quote" && !doc.archivedAt);
  const invoices = documents.filter((doc) => doc.kind === "invoice" && !doc.archivedAt);
  const contracts = documents.filter((doc) => doc.kind === "contract" && !doc.archivedAt);
  const openQuotes = quotes
    .filter((doc) => doc.status === "sent" || doc.status === "draft")
    .reduce((sum, doc) => sum + documentTotals(doc).gross, 0);
  const openInvoices = invoices
    .filter((doc) => isOpenReceivable(doc))
    .reduce((sum, doc) => sum + documentTotals(doc).gross, 0);
  const paid = invoices
    .filter((doc) => doc.status === "paid")
    .reduce((sum, doc) => sum + documentTotals(doc).gross, 0);

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-end justify-between">
        <p className="kicker">Finanzen</p>
        <Link href="/invoices" className="text-xs text-muted hover:text-foreground">
          Zur Buchhaltung
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Offene Angebote" value={formatMoney(openQuotes)} hint={`${quotes.length} aktiv`} />
        <StatCard label="Offene Rechnungen" value={formatMoney(openInvoices)} hint="Noch nicht bezahlt" />
        <StatCard label="Bezahlt" value={formatMoney(paid)} hint="Markiert als bezahlt" />
        <StatCard label="Verträge" value={String(contracts.length)} hint="Laufend" />
      </div>
    </div>
  );
}
