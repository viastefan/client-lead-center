"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { DocumentList } from "@/components/billing/document-list";
import { CustomerEditor } from "@/components/crm/customer-editor";
import { EmptyState, PageHeader, Panel, StatusBadge, StatCard } from "@/components/ui";
import { customerLedger } from "@/lib/billing/customer-finance";
import { formatMoney } from "@/lib/billing/format";
import { useBilling } from "@/lib/billing/store";
import { coerceDirectoryCustomer, sourceLabel, type DirectoryCustomer } from "@/lib/crm/types";
import { findDirectoryCustomer } from "@/lib/crm/directory";
import { useDirectory } from "@/lib/crm/use-directory";
import { websiteHref } from "@/lib/crm/website";
import { mailboxPayload } from "@/lib/email/mailbox-client";
import { htmlFromText } from "@/lib/email/html";

function subscribeReady(onStoreChange: () => void) {
  queueMicrotask(onStoreChange);
  return () => undefined;
}

export type CustomerLeadPreview = {
  id: string;
  name: string;
  email: string;
  status: string;
};

export type CustomerSitePreview = {
  id: string;
  name: string;
  domain: string;
};

export function CustomerWorkspace({
  id,
  seed = null,
  websites = [],
  leads = [],
}: {
  id: string;
  seed?: DirectoryCustomer | null;
  websites?: CustomerSitePreview[];
  leads?: CustomerLeadPreview[];
}) {
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);
  const directory = useDirectory(seed ? [seed] : []);
  const { documents, company, ready: billingReady } = useBilling();
  const [mailNote, setMailNote] = useState("");
  const [mailFlash, setMailFlash] = useState("");
  const [sending, setSending] = useState(false);
  const customer = useMemo(
    () => findDirectoryCustomer(directory, id) ?? (seed ? coerceDirectoryCustomer(seed) : undefined),
    [directory, id, seed],
  );
  const ledger = billingReady && customer ? customerLedger(documents, customer.id) : null;

  if (!ready) return <div className="glass h-40 animate-pulse rounded-lg" />;
  if (!customer) {
    return (
      <EmptyState
        title="Kunde nicht gefunden"
        description="Dieser Empfänger liegt nicht in der Kundendatenbank."
        action={
          <Link href="/clients" className="btn-primary">
            Zur Datenbank
          </Link>
        }
      />
    );
  }

  const siteHref = websiteHref(customer);

  async function sendNote() {
    if (!customer?.email) {
      setMailFlash("Keine E-Mail");
      window.setTimeout(() => setMailFlash(""), 1600);
      return;
    }
    setSending(true);
    const text = `Guten Tag ${customer.contactName || customer.companyName},\n\n${mailNote.trim() || "kurze Rückmeldung zu Ihrem Auftrag."}\n\n${company.legalName}\n${company.street}\n${company.zip} ${company.city}`.trim();
    const response = await fetch("/api/mail", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        mailboxPayload({
          to: customer.email,
          subject: `${customer.companyName} – kurze Nachricht`,
          text,
          html: htmlFromText(text, company.legalName),
          fromName: company.legalName,
        }),
      ),
    });
    const payload = (await response.json()) as { success?: boolean; error?: { message?: string } };
    setSending(false);
    setMailFlash(payload.success ? "Gesendet" : payload.error?.message || "Fehler");
    if (payload.success) setMailNote("");
    window.setTimeout(() => setMailFlash(""), 2200);
  }

  return (
    <>
      <PageHeader
        title={customer.companyName}
        description={`${customer.contactName} · ${customer.email}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/quotes/new?customer=${customer.id}`} className="btn-ghost">
              Angebot
            </Link>
            <Link href={`/invoices/new?customer=${customer.id}`} className="btn-primary">
              Rechnung
            </Link>
            <Link href={`/contracts/new?customer=${customer.id}`} className="btn-ghost">
              Vertrag
            </Link>
            {customer.phone ? (
              <a href={`tel:${customer.phone}`} className="btn-ghost">
                Anrufen
              </a>
            ) : null}
            {siteHref ? (
              <a href={siteHref} className="btn-ghost" target="_blank" rel="noreferrer">
                Website
              </a>
            ) : null}
            <StatusBadge>{sourceLabel(customer.source)}</StatusBadge>
          </div>
        }
      />

      {ledger ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard label="Offen" value={formatMoney(ledger.openAmount)} hint={`${ledger.invoices} Rechnungen`} />
          <StatCard label="Überfällig" value={formatMoney(ledger.overdueAmount)} hint="Gesendet, nicht bezahlt" />
          <StatCard label="Bezahlt" value={formatMoney(ledger.paidAmount)} hint={`${ledger.quotes} Angebote · ${ledger.contracts} Verträge`} />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Stammdaten" description="Adresse, USt-IdNr. und Mail gelten als Empfänger auf Angebot, Rechnung und Vertrag.">
          <CustomerEditor key={`${customer.id}-${customer.email}`} customer={customer} />
        </Panel>
        <div className="space-y-6">
          <Panel title="Websites">
            {websites.length === 0 && !customer.domain ? (
              <p className="text-[13px] text-muted">Keine Site hinterlegt. Domain oder Wix-URL in den Stammdaten ergänzen.</p>
            ) : (
              <ul className="space-y-2 text-[13px]">
                {websites.map((site) => (
                  <li key={site.id} className="flex items-center justify-between gap-3">
                    <span>{site.name}</span>
                    <span className="text-muted">{site.domain}</span>
                  </li>
                ))}
                {customer.domain && !websites.some((site) => site.domain.includes(customer.domain.replace(/^www\./, ""))) ? (
                  <li className="flex items-center justify-between gap-3">
                    <span>{sourceLabel(customer.source)}</span>
                    <span className="text-muted">{customer.domain}</span>
                  </li>
                ) : null}
              </ul>
            )}
          </Panel>
          <Panel title="Kurze Mail">
            <textarea
              rows={3}
              className="field h-auto py-2"
              placeholder="Text an den Empfänger…"
              value={mailNote}
              onChange={(event) => setMailNote(event.target.value)}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[12px] text-muted">{customer.email || "Keine E-Mail hinterlegt"}</p>
              <button type="button" className="btn-ghost" disabled={sending || !customer.email} onClick={() => void sendNote()}>
                {sending ? "Sendet…" : mailFlash || "Senden"}
              </button>
            </div>
          </Panel>
          <Panel
            title="Leads"
            action={
              <Link href={`/leads?customerId=${id}`} className="text-[12px] text-muted hover:text-foreground">
                Alle
              </Link>
            }
          >
            {leads.length === 0 ? (
              <p className="text-[13px] text-muted">Keine Anfragen zu diesem Kunden.</p>
            ) : (
              <ul className="space-y-2 text-[13px]">
                {leads.map((lead) => (
                  <li key={lead.id}>
                    <Link href={`/leads/${lead.id}`} className="hover:underline">
                      {lead.name}
                    </Link>
                    <span className="text-muted"> · {lead.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-6">
        <Panel title="Dokumente" description="Nur Belege dieses Empfängers.">
          <DocumentList customerId={customer.id} />
        </Panel>
      </div>
    </>
  );
}
