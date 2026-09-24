"use client";

import Link from "next/link";
import { financeSummary } from "@/lib/billing/finance";
import { formatMoney } from "@/lib/billing/format";
import { useBilling } from "@/lib/billing/store";
import { StatCard } from "@/components/ui";

export function FinancePulse() {
  const { documents, ready } = useBilling();
  if (!ready) return null;
  const summary = financeSummary(documents);

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-end justify-between">
        <p className="kicker">Finanzen</p>
        <Link href="/invoices" className="text-xs text-muted hover:text-foreground">
          Zur Buchhaltung
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Offene Angebote" value={formatMoney(summary.openQuoteAmount)} hint={`${summary.quotes} aktiv · ${summary.sentQuotes} unterwegs`} />
        <StatCard label="Offene Rechnungen" value={formatMoney(summary.openInvoiceAmount)} hint={summary.overdueCount ? `${summary.overdueCount} überfällig` : "Gesendet, noch offen"} />
        <StatCard label="Bezahlt" value={formatMoney(summary.paidAmount)} hint={`Diesen Monat ${formatMoney(summary.paidThisMonth)}`} />
        <StatCard label="Verträge" value={String(summary.contracts)} hint={`${summary.activeContracts} laufend`} />
      </div>
    </div>
  );
}
