import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/billing/document-list";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import {
  loadAutomationsForCustomer,
  loadCustomer,
  loadEmailAccountsForCustomer,
  loadLeads,
  loadWebsitesForCustomer,
} from "@/lib/data/workspace";
import { customerStatusLabel, emailStatusLabel, formatDateTime, leadStatusLabel } from "@/lib/format";
import { toggleCustomerStatusAction } from "@/lib/actions";

export const metadata = { title: "Kunde" };

const TABS = [
  { id: "overview", label: "Übersicht" },
  { id: "documents", label: "Dokumente" },
  { id: "websites", label: "Websites" },
  { id: "leads", label: "Leads" },
  { id: "email", label: "E-Mail" },
  { id: "automations", label: "Automationen" },
  { id: "settings", label: "Einstellungen" },
] as const;

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const customer = await loadCustomer(id);
  if (!customer) notFound();

  const [websites, leads, emails, automations] = await Promise.all([
    loadWebsitesForCustomer(id),
    loadLeads({ customerId: id }),
    loadEmailAccountsForCustomer(id),
    loadAutomationsForCustomer(id),
  ]);

  const emailConnected = emails.some((item) => item.status === "connected");

  return (
    <>
      <PageHeader
        title={customer.company_name}
        description={`${customer.contact_name} · ${customer.contact_email}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/quotes/new?customer=${customer.id}`} className="btn-ghost">
              Angebot
            </Link>
            <Link href={`/invoices/new?customer=${customer.id}`} className="btn-ghost">
              Rechnung
            </Link>
            <Link href={`/contracts/new?customer=${customer.id}`} className="btn-ghost">
              Vertrag
            </Link>
            <Link href={`/emails?customer=${customer.id}`} className="btn-ghost">
              Rundmail
            </Link>
            <StatusBadge tone={customer.status === "active" ? "success" : "neutral"}>
              {customerStatusLabel(customer.status)}
            </StatusBadge>
          </div>
        }
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {[
          { label: "Website", ok: websites.some((site) => site.active) },
          { label: "Lead API", ok: websites.some((site) => site.active && site.api_key_hash) },
          { label: "E-Mail", ok: emailConnected },
          { label: "AI", ok: false },
          { label: "Automationen", ok: automations.some((item) => item.enabled) },
        ].map((item) => (
          <span key={item.label} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
            {item.label}: {item.ok ? "verbunden" : "offen"}
          </span>
        ))}
      </div>

      <div className="mb-6 flex gap-4 overflow-x-auto border-b border-border">
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={`/clients/${id}?tab=${item.id}`}
            className={`shrink-0 border-b-2 pb-3 text-sm ${
              tab === item.id ? "border-foreground text-foreground" : "border-transparent text-muted"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {tab === "overview" || tab === "documents" ? (
        <div className={tab === "overview" ? "mb-6" : ""}>
          <Panel title="Angebote, Rechnungen & Verträge" description="Dokumente zu diesem Kunden.">
            <DocumentList customerId={customer.id} />
          </Panel>
        </div>
      ) : null}

      {tab === "overview" || tab === "leads" ? (
        <Panel title="Leads">
          <ul className="divide-y divide-border">
            {leads.slice(0, tab === "overview" ? 5 : 50).map((lead) => (
              <li key={lead.id} className="flex items-center justify-between gap-4 py-3">
                <Link href={`/leads/${lead.id}`} className="text-sm hover:underline">
                  {lead.name}
                </Link>
                <StatusBadge>{leadStatusLabel(lead.status)}</StatusBadge>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {tab === "overview" || tab === "websites" ? (
        <div className={tab === "overview" ? "mt-6" : ""}>
          <Panel title="Websites">
            <ul className="space-y-3">
              {websites.map((site) => (
                <li key={site.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/websites/${site.id}`} className="hover:underline">
                    {site.name}
                  </Link>
                  <span className="text-muted">{site.domain}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      ) : null}

      {tab === "email" ? (
        <Panel
          title="E-Mail"
          action={
            <Link href={`/emails?customer=${customer.id}`} className="text-[12px] text-muted hover:text-foreground">
              Rundmail
            </Link>
          }
        >
          <p className="text-[13px] text-muted">
            Kontakt: {customer.contact_email}. Versand über IONOS SMTP unter E-Mail.
          </p>
          {emails.length === 0 ? null : (
            <ul className="mt-4 space-y-3">
              {emails.map((account) => (
                <li key={account.id} className="flex items-center justify-between text-[13px]">
                  <span>
                    {account.email} · {account.provider}
                  </span>
                  <StatusBadge>{emailStatusLabel(account.status)}</StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}

      {tab === "automations" ? (
        <Panel title="Automationen">
          {automations.length === 0 ? (
            <p className="text-sm text-muted">Keine Automationen. Die Engine ist vorbereitet, aber noch nicht aktiv.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {automations.map((item) => (
                <li key={item.id}>
                  {item.name} · {item.trigger} → {item.action}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}

      {tab === "settings" ? (
        <Panel title="Einstellungen">
          <p className="text-sm leading-6 text-muted">
            Kunden können deaktiviert werden, ohne Daten zu löschen. Bestehende Leads bleiben erhalten.
          </p>
          <form
            className="mt-4"
            action={toggleCustomerStatusAction.bind(null, customer.id, customer.status === "active" ? "inactive" : "active")}
          >
            <button type="submit" className="h-9 rounded-lg border border-border px-3 text-sm">
              {customer.status === "active" ? "Kunde deaktivieren" : "Kunde aktivieren"}
            </button>
          </form>
          <p className="mt-4 text-xs text-subtle">Aktualisiert {formatDateTime(customer.updated_at)}</p>
        </Panel>
      ) : null}
    </>
  );
}
