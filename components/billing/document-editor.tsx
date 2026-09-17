"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Plus, Printer, Trash2 } from "lucide-react";
import { DocumentPreview } from "@/components/billing/document-preview";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { documentTotals } from "@/lib/billing/calc";
import { formatMoney, interpolateTemplate } from "@/lib/billing/format";
import { INVOICE_STATUSES, QUOTE_STATUSES, TEMPLATE_META, kindHref, kindLabel, statusLabel } from "@/lib/billing/labels";
import { newLineItem } from "@/lib/billing/defaults";
import { useBilling } from "@/lib/billing/store";
import type { BusinessDocument, DocumentKind, DocumentStatus, LineItem, TemplateId } from "@/lib/billing/types";
import { demoCustomers } from "@/lib/demo/workspace";

function applyCustomer(doc: BusinessDocument, customerId: string): BusinessDocument {
  const customer = demoCustomers().find((item) => item.id === customerId);
  if (!customer) {
    return { ...doc, customerId: "", customerName: "", customerContact: "", customerEmail: "" };
  }
  return {
    ...doc,
    customerId: customer.id,
    customerName: customer.company_name,
    customerContact: customer.contact_name,
    customerEmail: customer.contact_email,
    customerAddress: customer.notes?.replace("Live auf Vercel · ", "") ?? "",
  };
}

export function DocumentEditor({
  kind,
  id,
  presetCustomerId,
}: {
  kind: DocumentKind;
  id?: string;
  presetCustomerId?: string;
}) {
  const { ready, documents, blankDocument } = useBilling();

  if (!ready) {
    return <div className="glass h-72 animate-pulse rounded-3xl" />;
  }

  if (id) {
    const existing = documents.find((item) => item.id === id);
    if (!existing) {
      return (
        <EmptyState
          title="Dokument nicht gefunden"
          description="Es liegt nicht in diesem Browser-Archiv."
          action={
            <Link href={kindHref(kind)} className="btn-primary">
              Zur Liste
            </Link>
          }
        />
      );
    }
    return <DocumentEditorForm key={id} kind={kind} persistedId={id} initial={existing} />;
  }

  const initial = presetCustomerId
    ? applyCustomer(blankDocument(kind), presetCustomerId)
    : blankDocument(kind);
  return <DocumentEditorForm key="new" kind={kind} initial={initial} />;
}

function DocumentEditorForm({
  kind,
  persistedId,
  initial,
}: {
  kind: DocumentKind;
  persistedId?: string;
  initial: BusinessDocument;
}) {
  const id = persistedId;
  const router = useRouter();
  const { company, commitDocument, archiveDocument, convertQuoteToInvoice, duplicateDocument } = useBilling();
  const [working, setWorking] = useState(initial);
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const customers = demoCustomers();
  const totals = documentTotals(working);
  const statuses = kind === "quote" ? QUOTE_STATUSES : INVOICE_STATUSES;
  const title = useMemo(() => {
    return working.number ? `${kindLabel(kind)} ${working.number}` : `Neues ${kindLabel(kind)}`;
  }, [kind, working.number]);

  function patch(partial: Partial<BusinessDocument>) {
    setWorking({ ...working, ...partial });
  }

  function patchItem(itemId: string, partial: Partial<LineItem>) {
    patch({
      items: working.items.map((item) => (item.id === itemId ? { ...item, ...partial } : item)),
    });
  }

  function save() {
    const saved = commitDocument(working);
    setWorking(saved);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1400);
    if (!id) {
      router.replace(`${kindHref(kind)}/${saved.id}`);
    }
  }

  function printDoc() {
    commitDocument(working);
    window.print();
  }

  async function copyMail() {
    const subject = interpolateTemplate(
      kind === "quote" ? company.quoteEmailSubject : company.invoiceEmailSubject,
      {
        number: working.number || "Entwurf",
        company: working.customerName || company.legalName,
      },
    );
    const greeting = working.customerContact ? `Guten Tag ${working.customerContact},` : "Guten Tag,";
    const body = [
      greeting,
      "",
      `anbei ${kind === "quote" ? "unser Angebot" : "unsere Rechnung"} ${working.number || ""}.`.trim(),
      `Gesamtbetrag: ${formatMoney(totals.gross, working.currency)}.`,
      "",
      company.footer,
      "",
      company.legalName,
      company.ownerName,
    ].join("\n");
    await navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="document-workspace">
      <PageHeader
        title={title}
        description="Links schreiben, rechts die Vorlage. Drucken erzeugt ein sauberes DIN-A4."
        action={
          <div className="flex flex-wrap gap-2">
            {kind === "quote" && id ? (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  const invoice = convertQuoteToInvoice(working.id);
                  if (invoice) router.push(`/invoices/${invoice.id}`);
                }}
              >
                Als Rechnung
              </button>
            ) : null}
            {id ? (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  const copy = duplicateDocument(working.id);
                  if (copy) router.push(`${kindHref(kind)}/${copy.id}`);
                }}
              >
                Duplizieren
              </button>
            ) : null}
            {id ? (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  archiveDocument(working.id);
                  router.push(kindHref(kind));
                }}
              >
                Archivieren
              </button>
            ) : null}
            <button type="button" className="btn-ghost" onClick={() => void copyMail()}>
              <Copy size={14} />
              {copied ? "Kopiert" : "E-Mail"}
            </button>
            <button type="button" className="btn-ghost" onClick={printDoc}>
              <Printer size={14} />
              Drucken
            </button>
            <button type="button" className="btn-primary" onClick={save}>
              {savedFlash ? "Gespeichert" : "Speichern"}
            </button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <form
          className="glass space-y-5 rounded-[28px] p-5"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-subtle">Kunde</span>
              <select
                className="field"
                value={working.customerId}
                onChange={(event) => setWorking(applyCustomer(working, event.target.value))}
              >
                <option value="">Kunde wählen</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-subtle">Status</span>
              <select
                className="field"
                value={working.status}
                onChange={(event) => patch({ status: event.target.value as DocumentStatus })}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-subtle">Datum</span>
              <input
                type="date"
                className="field"
                value={working.issueDate}
                onChange={(event) => patch({ issueDate: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-subtle">{kind === "quote" ? "Gültig bis" : "Fällig"}</span>
              <input
                type="date"
                className="field"
                value={working.dueDate}
                onChange={(event) => patch({ dueDate: event.target.value })}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs text-subtle">Adresse</span>
            <textarea
              rows={2}
              className="field h-auto py-2"
              value={working.customerAddress}
              onChange={(event) => patch({ customerAddress: event.target.value })}
            />
          </label>

          <div>
            <p className="mb-2 text-xs text-subtle">Vorlage</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TEMPLATE_META) as TemplateId[]).map((templateId) => (
                <button
                  key={templateId}
                  type="button"
                  onClick={() => patch({ templateId })}
                  className={`rounded-2xl border px-3 py-2 text-left transition ${
                    working.templateId === templateId
                      ? "border-white/25 bg-white/10"
                      : "border-border bg-white/[0.04] hover:bg-white/[0.08]"
                  }`}
                >
                  <span className="block text-sm font-medium">{TEMPLATE_META[templateId].name}</span>
                  <span className="mt-1 block text-[11px] leading-4 text-muted">{TEMPLATE_META[templateId].note}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs text-subtle">Einleitung</span>
            <textarea
              rows={2}
              className="field h-auto py-2"
              value={working.intro}
              onChange={(event) => patch({ intro: event.target.value })}
            />
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-subtle">Positionen</p>
              <button
                type="button"
                className="btn-ghost h-8"
                onClick={() => patch({ items: [...working.items, newLineItem(company.defaultUnit)] })}
              >
                <Plus size={14} />
                Position
              </button>
            </div>
            {working.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-white/[0.04] p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    className="field h-10"
                    placeholder="Titel"
                    value={item.title}
                    onChange={(event) => patchItem(item.id, { title: event.target.value })}
                  />
                  <button
                    type="button"
                    className="btn-ghost h-10 w-10 px-0"
                    aria-label="Position entfernen"
                    onClick={() => {
                      const next = working.items.filter((row) => row.id !== item.id);
                      patch({ items: next.length > 0 ? next : [newLineItem(company.defaultUnit)] });
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  rows={2}
                  className="field mt-2 h-auto py-2"
                  placeholder="Beschreibung"
                  value={item.description}
                  onChange={(event) => patchItem(item.id, { description: event.target.value })}
                />
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[11px] text-subtle">Menge</span>
                    <input
                      className="field h-10"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.qty}
                      onChange={(event) => patchItem(item.id, { qty: Number(event.target.value) })}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] text-subtle">Einheit</span>
                    <input
                      className="field h-10"
                      placeholder="Einheit"
                      value={item.unit}
                      onChange={(event) => patchItem(item.id, { unit: event.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] text-subtle">Preis</span>
                    <input
                      className="field h-10"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(event) => patchItem(item.id, { unitPrice: Number(event.target.value) })}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-subtle">MwSt. %</span>
              <input
                className="field"
                type="number"
                min="0"
                step="0.1"
                value={working.taxRate}
                onChange={(event) => patch({ taxRate: Number(event.target.value) })}
              />
            </label>
            <div className="flex items-end justify-between rounded-2xl border border-border px-4 py-3">
              <span className="text-xs text-subtle">Gesamt</span>
              <strong className="text-lg tabular-nums">{formatMoney(totals.gross, working.currency)}</strong>
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs text-subtle">Fußtext</span>
            <textarea
              rows={3}
              className="field h-auto py-2"
              value={working.notes}
              onChange={(event) => patch({ notes: event.target.value })}
            />
          </label>
        </form>

        <div className="print-stage">
          <div className="mb-3 flex items-center justify-between text-xs text-subtle">
            <span>Live-Vorlage · {TEMPLATE_META[working.templateId].name}</span>
            <StatusBadge>{statusLabel(working.status)}</StatusBadge>
          </div>
          <div className="preview-frame">
            <DocumentPreview document={working} company={company} />
          </div>
        </div>
      </div>
    </div>
  );
}
