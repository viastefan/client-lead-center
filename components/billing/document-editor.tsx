"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Link2, Plus, Printer, Send, Trash2 } from "lucide-react";
import { DocumentPreview } from "@/components/billing/document-preview";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { documentTotals, lineNet } from "@/lib/billing/calc";
import { documentCorrespondence, type CorrespondenceVariant } from "@/lib/billing/correspondence";
import { formatLongDate, formatMoney } from "@/lib/billing/format";
import { CONTRACT_STATUSES, INVOICE_STATUSES, QUOTE_STATUSES, TEMPLATE_META, dateFieldLabel, kindHref, kindLabel, newKindTitle, statusLabel } from "@/lib/billing/labels";
import { paymentSnapshotFor, paymentUrl } from "@/lib/billing/payment";
import { newLineItem } from "@/lib/billing/defaults";
import { SERVICE_PRESETS } from "@/lib/billing/presets";
import { useBilling } from "@/lib/billing/store";
import type { BusinessDocument, DocumentKind, DocumentStatus, LineItem, TemplateId } from "@/lib/billing/types";
import { RecipientPicker } from "@/components/crm/recipient-picker";
import { persistRecipientFromDocument } from "@/lib/crm/from-document";
import { findDirectoryCustomer } from "@/lib/crm/directory";
import { useDirectory } from "@/lib/crm/use-directory";
import type { DirectoryCustomer } from "@/lib/crm/types";
import { mailboxPayload } from "@/lib/email/mailbox-client";
import { documentMailHtml } from "@/lib/email/document-mail";

function bindRecipient(doc: BusinessDocument): BusinessDocument {
  const saved = persistRecipientFromDocument(doc);
  if (!saved) return doc;
  return {
    ...doc,
    customerId: saved.id,
    customerName: saved.companyName || doc.customerName,
    customerContact: saved.contactName || doc.customerContact,
    customerEmail: saved.email || doc.customerEmail,
    customerAddress: saved.address || doc.customerAddress,
    customerVatId: saved.vatId || doc.customerVatId,
    customerPhone: saved.phone || doc.customerPhone,
  };
}

function applyDirectoryCustomer(doc: BusinessDocument, customer: DirectoryCustomer | null): BusinessDocument {
  if (!customer) {
    return {
      ...doc,
      customerId: "",
      customerName: "",
      customerContact: "",
      customerEmail: "",
      customerAddress: "",
      customerVatId: "",
      customerPhone: "",
    };
  }
  return {
    ...doc,
    customerId: customer.id,
    customerName: customer.companyName,
    customerContact: customer.contactName,
    customerEmail: customer.email,
    customerAddress: customer.address || customer.domain,
    customerVatId: customer.vatId,
    customerPhone: customer.phone,
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
  const customers = useDirectory();

  if (!ready) {
    return <div className="glass h-72 animate-pulse rounded-lg" />;
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

  const preset = presetCustomerId ? findDirectoryCustomer(customers, presetCustomerId) : undefined;
  const initial = preset ? applyDirectoryCustomer(blankDocument(kind), preset) : blankDocument(kind);
  return <DocumentEditorForm key={`new-${preset?.id ?? "none"}`} kind={kind} initial={initial} />;
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
  const { company, commitDocument, archiveDocument, convertQuoteToInvoice, convertQuoteToContract, duplicateDocument, addReminder, reminders, setDocumentStatus } =
    useBilling();
  const [working, setWorking] = useState(initial);
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mailFlash, setMailFlash] = useState("");
  const [sending, setSending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const totals = documentTotals(working);
  const statuses = kind === "quote" ? QUOTE_STATUSES : kind === "invoice" ? INVOICE_STATUSES : CONTRACT_STATUSES;
  const title = useMemo(() => {
    return working.number ? `${kindLabel(kind)} ${working.number}` : newKindTitle(kind);
  }, [kind, working.number]);

  function patch(partial: Partial<BusinessDocument>) {
    setWorking({ ...working, ...partial });
    setDirty(true);
  }

  function patchItem(itemId: string, partial: Partial<LineItem>) {
    patch({
      items: working.items.map((item) => (item.id === itemId ? { ...item, ...partial } : item)),
    });
  }

  function save() {
    const saved = commitDocument(bindRecipient(working));
    setWorking(saved);
    setDirty(false);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1400);
    if (!id) {
      router.replace(`${kindHref(kind)}/${saved.id}`);
    }
    return saved;
  }

  function printDoc() {
    commitDocument(bindRecipient(working));
    setDirty(false);
    window.print();
  }

  async function copyMail() {
    const { subject, body } = documentCorrespondence(working, company, window.location.origin);
    await navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  async function sendMail(variant: CorrespondenceVariant = "send") {
    if (!working.customerEmail) {
      setMailFlash("Empfänger ohne E-Mail");
      window.setTimeout(() => setMailFlash(""), 1600);
      return;
    }
    setSending(true);
    const saved = commitDocument(bindRecipient(working));
    setWorking(saved);
    setDirty(false);
    const { subject, body } = documentCorrespondence(saved, company, window.location.origin, variant);
    const response = await fetch("/api/mail", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        mailboxPayload({
          to: saved.customerEmail,
          subject,
          text: body,
          html: documentMailHtml(saved, company, body, variant),
          fromName: company.legalName,
        }),
      ),
    });
    const payload = (await response.json()) as { success?: boolean; error?: { message?: string } };
    if (payload.success) {
      const mailed = commitDocument({
        ...saved,
        status: variant === "send" && saved.status === "draft" ? "sent" : saved.status,
        sentAt: saved.sentAt || new Date().toISOString(),
        lastMailedAt: new Date().toISOString(),
      });
      setWorking(mailed);
      if (variant === "send" && saved.kind === "invoice" && !reminders.some((item) => item.relatedId === saved.id)) {
        addReminder({
          title: `Zahlung ${saved.number} nachfassen`,
          note: saved.customerName,
          dueDate: saved.dueDate,
          source: "invoice",
          relatedId: saved.id,
          customerName: saved.customerName,
        });
      }
    }
    setSending(false);
    setMailFlash(payload.success ? (variant === "reminder" ? "Erinnerung gesendet" : variant === "followup" ? "Nachgefasst" : "Gesendet") : payload.error?.message || "Fehler");
    window.setTimeout(() => setMailFlash(""), 2400);
  }

  async function copyPaymentLink() {
    const origin = window.location.origin;
    const snapshot = paymentSnapshotFor(working, company);
    await navigator.clipboard.writeText(paymentUrl(origin, snapshot));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="document-workspace">
      <PageHeader
        title={title}
        description={dirty ? "Ungespeicherte Änderungen · ⌘S speichert." : "Links schreiben, rechts die Vorlage. Drucken erzeugt ein sauberes DIN-A4."}
        action={
          <div className="flex flex-wrap gap-2">
            {kind === "quote" && id ? (
              <>
                {working.status === "sent" || working.status === "draft" ? (
                  <button type="button" className="btn-ghost" onClick={() => { const next = commitDocument({ ...working, status: "accepted" }); setWorking(next); setDirty(false); }}>
                    Annehmen
                  </button>
                ) : null}
                {working.status === "sent" || working.status === "accepted" ? (
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
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    const contract = convertQuoteToContract(working.id);
                    if (contract) router.push(`/contracts/${contract.id}`);
                  }}
                >
                  Als Vertrag
                </button>
              </>
            ) : null}
            {kind === "invoice" && id && working.status !== "paid" ? (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setDocumentStatus(working.id, "paid");
                  setWorking({ ...working, status: "paid", paidAt: working.paidAt || new Date().toISOString().slice(0, 10) });
                  setDirty(false);
                }}
              >
                Bezahlt
              </button>
            ) : null}
            {kind === "contract" && id && working.status !== "signed" && working.status !== "active" ? (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  const next = commitDocument({ ...working, status: "signed" });
                  setWorking(next);
                  setDirty(false);
                }}
              >
                Unterzeichnen
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
            {kind === "invoice" ? (
              <button type="button" className="btn-ghost" onClick={() => void copyPaymentLink()}>
                <Link2 size={14} />
                Zahlungslink
              </button>
            ) : null}
            {kind === "invoice" && (working.status === "sent" || working.status === "overdue") ? (
              <button type="button" className="btn-ghost" onClick={() => void sendMail("reminder")}>
                Zahlung erinnern
              </button>
            ) : null}
            {kind === "quote" && (working.status === "sent" || working.status === "expired") ? (
              <button type="button" className="btn-ghost" onClick={() => void sendMail("followup")}>
                Nachfassen
              </button>
            ) : null}
            <button type="button" className="btn-ghost" onClick={() => void copyMail()}>
              <Copy size={14} />
              {copied ? "Kopiert" : "E-Mail"}
            </button>
            <button type="button" className="btn-ghost" disabled={sending} onClick={() => void sendMail()}>
              <Send size={14} />
              {sending ? "Sendet…" : mailFlash || "Senden"}
            </button>
            <button type="button" className="btn-ghost" onClick={printDoc}>
              <Printer size={14} />
              Drucken
            </button>
            <button type="button" className="btn-primary" onClick={save}>
              {savedFlash ? "Gespeichert" : dirty ? "Speichern*" : "Speichern"}
            </button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <form
          className="glass space-y-5 rounded-lg p-5"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <RecipientPicker
              value={working.customerId}
              onChange={(customer) => {
                setWorking(applyDirectoryCustomer(working, customer));
                setDirty(true);
              }}
            />
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
              <span className="mb-1.5 block text-xs text-subtle">Empfänger-Name</span>
              <input
                className="field"
                value={working.customerName}
                onChange={(event) => patch({ customerName: event.target.value })}
                placeholder="Firma"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-subtle">Ansprechpartner</span>
              <input
                className="field"
                value={working.customerContact}
                onChange={(event) => patch({ customerContact: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-subtle">E-Mail Empfänger</span>
              <input
                className="field"
                type="email"
                value={working.customerEmail}
                onChange={(event) => patch({ customerEmail: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-subtle">Telefon</span>
              <input
                className="field"
                value={working.customerPhone}
                onChange={(event) => patch({ customerPhone: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-subtle">USt-IdNr. Empfänger</span>
              <input
                className="field"
                value={working.customerVatId}
                onChange={(event) => patch({ customerVatId: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-subtle">Nummer</span>
              <input className="field" value={working.number || "Wird beim Speichern vergeben"} readOnly />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-subtle">Datum</span>
              <input
                type="date"
                className="field"
                value={working.issueDate}
                onChange={(event) => patch({ issueDate: event.target.value, serviceDate: working.serviceDate || event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-subtle">{dateFieldLabel(kind)}</span>
              <input
                type="date"
                className="field"
                value={working.dueDate}
                onChange={(event) => patch({ dueDate: event.target.value })}
              />
            </label>
            {kind === "invoice" ? (
              <label className="block">
                <span className="mb-1.5 block text-xs text-subtle">Leistungsdatum</span>
                <input
                  type="date"
                  className="field"
                  value={working.serviceDate || working.issueDate}
                  onChange={(event) => patch({ serviceDate: event.target.value })}
                />
              </label>
            ) : null}
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
                  className={`rounded-md border px-3 py-2 text-left transition ${
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
            <div className="flex flex-wrap gap-1.5">
              {SERVICE_PRESETS.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted hover:text-foreground"
                  onClick={() =>
                    patch({
                      items: [
                        ...working.items.filter((item) => item.title || item.unitPrice),
                        { ...preset, id: crypto.randomUUID() },
                      ],
                    })
                  }
                >
                  + {preset.title}
                </button>
              ))}
            </div>
            {working.items.map((item) => (
              <div key={item.id} className="rounded-md border border-border bg-white/[0.04] p-3">
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
                <div className="mt-2 grid grid-cols-4 gap-2">
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
                  <div className="flex flex-col justify-end">
                    <span className="mb-1 block text-[11px] text-subtle">Netto</span>
                    <p className="h-10 leading-10 text-[13px] tabular-nums">{formatMoney(lineNet(item), working.currency)}</p>
                  </div>
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
            <label className="block">
              <span className="mb-1.5 block text-xs text-subtle">Nachlass %</span>
              <input
                className="field"
                type="number"
                min="0"
                step="0.1"
                value={working.discountPercent}
                onChange={(event) => patch({ discountPercent: Number(event.target.value) })}
              />
            </label>
            <div className="space-y-1 rounded-md border border-border px-4 py-3 text-[13px] sm:col-span-2">
              <div className="flex justify-between text-muted">
                <span>Netto</span>
                <span className="tabular-nums">{formatMoney(totals.subtotal, working.currency)}</span>
              </div>
              {totals.discount > 0 ? (
                <div className="flex justify-between text-muted">
                  <span>Nachlass {totals.discountPercent}%</span>
                  <span className="tabular-nums">−{formatMoney(totals.discount, working.currency)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-muted">
                <span>MwSt. {working.taxRate}%</span>
                <span className="tabular-nums">{formatMoney(totals.tax, working.currency)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Gesamt</span>
                <span className="tabular-nums">{formatMoney(totals.gross, working.currency)}</span>
              </div>
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

          <dl className="grid gap-2 text-[12px] text-muted sm:grid-cols-2">
            <div>
              <dt className="text-subtle">Angelegt</dt>
              <dd>{formatLongDate(working.createdAt.slice(0, 10))}</dd>
            </div>
            {working.sentAt ? (
              <div>
                <dt className="text-subtle">Gesendet</dt>
                <dd>{formatLongDate(working.sentAt.slice(0, 10))}</dd>
              </div>
            ) : null}
            {working.lastMailedAt ? (
              <div>
                <dt className="text-subtle">Letzte Mail</dt>
                <dd>{formatLongDate(working.lastMailedAt.slice(0, 10))}</dd>
              </div>
            ) : null}
            {working.paidAt ? (
              <div>
                <dt className="text-subtle">Bezahlt</dt>
                <dd>{formatLongDate(working.paidAt.slice(0, 10))}</dd>
              </div>
            ) : null}
          </dl>
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
