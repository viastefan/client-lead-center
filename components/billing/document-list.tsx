"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EntityMark } from "@/components/entity-mark";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { documentTotals, isOverdueInvoice } from "@/lib/billing/calc";
import { formatMoney } from "@/lib/billing/format";
import { kindHref, kindLabel, statusLabel, statusTone } from "@/lib/billing/labels";
import { useBilling } from "@/lib/billing/store";
import type { DocumentKind, DocumentStatus } from "@/lib/billing/types";

const FILTERS: Array<{ id: "all" | "draft" | "open" | "overdue" | "paid"; label: string }> = [
  { id: "all", label: "Alle" },
  { id: "draft", label: "Entwurf" },
  { id: "open", label: "Unterwegs" },
  { id: "overdue", label: "Überfällig" },
  { id: "paid", label: "Erledigt" },
];

export function DocumentList({
  kind,
  archived = false,
  customerId,
}: {
  kind?: DocumentKind;
  archived?: boolean;
  customerId?: string;
}) {
  const { documents, ready, restoreDocument, setDocumentStatus } = useBilling();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const rows = useMemo(() => {
    return documents
      .filter((doc) => (archived ? Boolean(doc.archivedAt) : !doc.archivedAt))
      .filter((doc) => (kind ? doc.kind === kind : true))
      .filter((doc) => (customerId ? doc.customerId === customerId : true))
      .filter((doc) => {
        const hay = `${doc.number} ${doc.customerName} ${doc.customerEmail} ${doc.customerContact}`.toLowerCase();
        return hay.includes(query.trim().toLowerCase());
      })
      .filter((doc) => {
        if (filter === "all") return true;
        if (filter === "draft") return doc.status === "draft";
        if (filter === "open") return doc.status === "sent" || doc.status === "accepted" || doc.status === "active";
        if (filter === "overdue") return isOverdueInvoice(doc) || doc.status === "overdue";
        if (filter === "paid") return doc.status === "paid" || doc.status === "invoiced" || doc.status === "signed";
        return true;
      })
      .sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || ""));
  }, [archived, customerId, documents, filter, kind, query]);

  const title =
    archived ? "Archiv" : kind === "quote" ? "Angebote" : kind === "invoice" ? "Rechnungen" : kind === "contract" ? "Verträge" : "Dokumente";
  const description = archived
    ? "Abgelegte Angebote, Rechnungen und Verträge."
    : kind === "quote"
      ? "Empfänger wählen, senden, dann in Rechnung wandeln."
      : kind === "invoice"
        ? "Rechnungen mit Empfänger, Zahlungslink, Mahnung und MwSt."
        : kind === "contract"
          ? "Verträge mit Laufzeit, Empfänger und Erinnerungen."
          : "Dokumente zu diesem Kunden.";

  return (
    <>
      {customerId ? null : (
        <PageHeader
          title={title}
          description={description}
          action={
            kind && !archived ? (
              <Link href={`${kindHref(kind)}/new`} className="btn-primary">
                {kind === "quote" ? "Neues Angebot" : kind === "invoice" ? "Neue Rechnung" : "Neuer Vertrag"}
              </Link>
            ) : null
          }
        />
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              filter === item.id ? "border-white/25 bg-white/10 text-foreground" : "border-border text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mb-4 rounded-md border border-border px-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nummer, Empfänger, E-Mail"
          className="h-10 w-full bg-transparent text-[13px] outline-none placeholder:text-subtle"
        />
      </div>

      {!ready ? (
        <div className="glass h-40 animate-pulse rounded-lg" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Noch leer"
          description={archived ? "Nichts archiviert." : "Erst Empfänger wählen, dann das Dokument schreiben und senden."}
          action={
            kind && !archived ? (
              <Link
                href={customerId ? `${kindHref(kind)}/new?customer=${customerId}` : `${kindHref(kind)}/new`}
                className="btn-primary"
              >
                Anlegen
              </Link>
            ) : null
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {rows.map((doc) => {
            const totals = documentTotals(doc);
            const overdue = isOverdueInvoice(doc) || doc.status === "overdue";
            return (
              <li key={doc.id}>
                <div className="row rounded-none">
                  <Link href={`${kindHref(doc.kind)}/${doc.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <EntityMark name={doc.customerName || kindLabel(doc.kind)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {doc.number || "Entwurf"} · {doc.customerName || "Ohne Empfänger"}
                      </p>
                      <p className="truncate text-[12px] text-muted">
                        {doc.customerEmail || kindLabel(doc.kind)}
                        {doc.dueDate ? ` · fällig ${doc.dueDate}` : ""}
                      </p>
                    </div>
                    <StatusBadge tone={overdue ? "danger" : statusTone(doc.status as DocumentStatus)}>
                      {overdue ? "Überfällig" : statusLabel(doc.status)}
                    </StatusBadge>
                    <p className="hidden w-24 text-right text-[13px] tabular-nums sm:block">
                      {formatMoney(totals.gross, doc.currency)}
                    </p>
                  </Link>
                  {archived ? (
                    <button type="button" className="btn-ghost shrink-0" onClick={() => restoreDocument(doc.id)}>
                      Zurück
                    </button>
                  ) : doc.kind === "invoice" && doc.status !== "paid" ? (
                    <button
                      type="button"
                      className="btn-ghost shrink-0"
                      onClick={() => setDocumentStatus(doc.id, "paid")}
                    >
                      Bezahlt
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
