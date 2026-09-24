"use client";

import { useState } from "react";
import { Panel } from "@/components/ui";
import { TemplateGallery } from "@/components/billing/template-gallery";
import { useBilling } from "@/lib/billing/store";
import type { CompanyProfile, TemplateId } from "@/lib/billing/types";

export function CompanySettingsForm() {
  const { ready, company, sequences, saveCompany, saveSequences } = useBilling();
  const [form, setForm] = useState<CompanyProfile | null>(null);
  const [nextQuote, setNextQuote] = useState<number | null>(null);
  const [nextInvoice, setNextInvoice] = useState<number | null>(null);
  const [nextContract, setNextContract] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const working = form ?? company;
  const quoteSeq = nextQuote ?? sequences.quote + 1;
  const invoiceSeq = nextInvoice ?? sequences.invoice + 1;
  const contractSeq = nextContract ?? sequences.contract + 1;

  function patch<K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) {
    setForm({ ...working, [key]: value });
  }

  if (!ready) return <div className="glass h-40 animate-pulse rounded-lg" />;

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        saveCompany(working);
        saveSequences({
          quote: Math.max(0, Math.floor(quoteSeq) - 1),
          invoice: Math.max(0, Math.floor(invoiceSeq) - 1),
          contract: Math.max(0, Math.floor(contractSeq) - 1),
        });
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1400);
      }}
    >
      <Panel title="Unternehmen" description="Erscheint auf jedem Angebot und jeder Rechnung.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" value={working.legalName} onChange={(value) => patch("legalName", value)} />
          <Field label="Auftritt (optional)" value={working.tradeName} onChange={(value) => patch("tradeName", value)} />
          <Field label="Inhaber" value={working.ownerName} onChange={(value) => patch("ownerName", value)} />
          <Field label="E-Mail" value={working.email} onChange={(value) => patch("email", value)} type="email" />
          <Field label="Telefon" value={working.phone} onChange={(value) => patch("phone", value)} />
          <Field label="Website" value={working.website} onChange={(value) => patch("website", value)} />
          <Field label="Straße" value={working.street} onChange={(value) => patch("street", value)} />
          <Field label="PLZ" value={working.zip} onChange={(value) => patch("zip", value)} />
          <Field label="Ort" value={working.city} onChange={(value) => patch("city", value)} />
          <Field label="Land" value={working.country} onChange={(value) => patch("country", value)} />
        </div>
      </Panel>

      <Panel title="Steuer & Bank" description="USt, Steuernummer und Überweisungsdaten.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="USt-IdNr." value={working.vatId} onChange={(value) => patch("vatId", value)} />
          <Field label="Steuernummer" value={working.taxNumber} onChange={(value) => patch("taxNumber", value)} />
          <Field label="Gewerbe / Aktenzeichen" value={working.register} onChange={(value) => patch("register", value)} />
          <Field label="Bank" value={working.bankName} onChange={(value) => patch("bankName", value)} />
          <Field label="IBAN" value={working.iban} onChange={(value) => patch("iban", value)} />
          <Field label="BIC" value={working.bic} onChange={(value) => patch("bic", value)} />
          <label className="block">
            <span className="mb-1.5 block text-xs text-subtle">Standard-MwSt. %</span>
            <input
              className="field"
              type="number"
              min="0"
              step="0.1"
              value={working.taxRate}
              onChange={(event) => patch("taxRate", Number(event.target.value))}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-subtle">Zahlungsziel (Tage)</span>
            <input
              className="field"
              type="number"
              min="0"
              value={working.paymentDays}
              onChange={(event) => patch("paymentDays", Number(event.target.value))}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-subtle">Skonto %</span>
            <input
              className="field"
              type="number"
              min="0"
              step="0.1"
              value={working.skontoPercent}
              onChange={(event) => patch("skontoPercent", Number(event.target.value))}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-subtle">Skonto (Tage)</span>
            <input
              className="field"
              type="number"
              min="0"
              value={working.skontoDays}
              onChange={(event) => patch("skontoDays", Number(event.target.value))}
            />
          </label>
        </div>
      </Panel>

      <Panel title="Nummernkreise" description="Nächste freie Nummer. Bestehende Dokumente bleiben unverändert.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Angebots-Präfix" value={working.quotePrefix} onChange={(value) => patch("quotePrefix", value)} />
          <Field
            label="Rechnungs-Präfix"
            value={working.invoicePrefix}
            onChange={(value) => patch("invoicePrefix", value)}
          />
          <Field
            label="Vertrags-Präfix"
            value={working.contractPrefix}
            onChange={(value) => patch("contractPrefix", value)}
          />
          <label className="block">
            <span className="mb-1.5 block text-xs text-subtle">Nächste Vertragsnummer</span>
            <input
              className="field"
              type="number"
              min="1"
              value={contractSeq}
              onChange={(event) => setNextContract(Number(event.target.value))}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-subtle">Nächste Angebotsnummer</span>
            <input
              className="field"
              type="number"
              min="1"
              value={quoteSeq}
              onChange={(event) => setNextQuote(Number(event.target.value))}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-subtle">Nächste Rechnungsnummer</span>
            <input
              className="field"
              type="number"
              min="1"
              value={invoiceSeq}
              onChange={(event) => setNextInvoice(Number(event.target.value))}
            />
          </label>
          <Field
            label="Standard-Einheit"
            value={working.defaultUnit}
            onChange={(value) => patch("defaultUnit", value)}
          />
        </div>
      </Panel>

      <Panel title="Texte & Korrespondenz" description="Standardtexte und Betreffzeilen für den Versand.">
        <label className="block">
          <span className="mb-1.5 block text-xs text-subtle">Angebotstext</span>
          <textarea
            className="field h-auto py-2"
            rows={3}
            value={working.quoteNote}
            onChange={(event) => patch("quoteNote", event.target.value)}
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs text-subtle">Rechnungstext</span>
          <textarea
            className="field h-auto py-2"
            rows={3}
            value={working.invoiceNote}
            onChange={(event) => patch("invoiceNote", event.target.value)}
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs text-subtle">Vertragstext</span>
          <textarea
            className="field h-auto py-2"
            rows={3}
            value={working.contractNote}
            onChange={(event) => patch("contractNote", event.target.value)}
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs text-subtle">Fußzeile</span>
          <textarea
            className="field h-auto py-2"
            rows={2}
            value={working.footer}
            onChange={(event) => patch("footer", event.target.value)}
          />
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field
            label="E-Mail-Betreff Angebot"
            value={working.quoteEmailSubject}
            onChange={(value) => patch("quoteEmailSubject", value)}
          />
          <Field
            label="E-Mail-Betreff Rechnung"
            value={working.invoiceEmailSubject}
            onChange={(value) => patch("invoiceEmailSubject", value)}
          />
          <Field
            label="E-Mail-Betreff Vertrag"
            value={working.contractEmailSubject}
            onChange={(value) => patch("contractEmailSubject", value)}
          />
        </div>
        <p className="mt-2 text-xs text-subtle">Platzhalter: {"{number}"} und {"{company}"}.</p>
      </Panel>

      <Panel title="Zahlungslinks" description="PayPal, Stripe und Hinweis auf der öffentlichen Zahlungsseite.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="PayPal-Link (paypal.me/...)"
            value={working.paypalUrl}
            onChange={(value) => patch("paypalUrl", value)}
          />
          <Field
            label="Stripe Payment Link"
            value={working.stripePaymentUrl}
            onChange={(value) => patch("stripePaymentUrl", value)}
          />
        </div>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs text-subtle">Zahlungshinweis</span>
          <textarea
            className="field h-auto py-2"
            rows={2}
            value={working.paymentNote}
            onChange={(event) => patch("paymentNote", event.target.value)}
          />
        </label>
      </Panel>

      <Panel title="Designvorlagen" description="Atelier, Linear oder Noir. Die Wahl gilt für neue Dokumente.">
        <TemplateGallery
          value={working.defaultTemplate}
          onChange={(templateId: TemplateId) => patch("defaultTemplate", templateId)}
        />
      </Panel>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary">
          {saved ? "Gespeichert" : "Einstellungen speichern"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-subtle">{label}</span>
      <input className="field" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
