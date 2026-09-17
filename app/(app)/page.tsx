import Link from "next/link";
import { EmptyState, PageHeader, Panel, StatCard, StatusBadge } from "@/components/ui";
import { EntityMark } from "@/components/entity-mark";
import { loadDashboardStats } from "@/lib/data/workspace";
import { matchCatalogToWebsites, VERCEL_CUSTOMER_SITES } from "@/lib/catalog/vercel-sites";
import { formatDateTime, leadStatusLabel } from "@/lib/format";
import { FinancePulse } from "@/components/billing/finance-pulse";
import { RecentDocuments } from "@/components/billing/recent-documents";
import { ReminderPulse } from "@/components/ops/reminder-pulse";
import {
  hasClaudeKey,
  hasGoogleOAuth,
  hasIonosSmtp,
  hasMicrosoftOAuth,
  hasResendKey,
  isSupabaseAdminConfigured,
} from "@/lib/env";

export const metadata = { title: "Dashboard" };

function toneForLead(status: string) {
  if (status === "new" || status === "urgent") return "warning" as const;
  if (status === "closed") return "success" as const;
  if (status === "spam") return "danger" as const;
  return "neutral" as const;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

export default async function DashboardPage() {
  const stats = await loadDashboardStats();
  const matches = matchCatalogToWebsites(stats.websites);
  const connectedCount = matches.filter((item) => item.website).length;

  const system = [
    { label: "API", ok: true, note: "Operational" },
    { label: "Database", ok: !stats.migrationMissing, note: stats.migrationMissing ? "Warning" : "Operational" },
    {
      label: "Storage",
      ok: isSupabaseAdminConfigured(),
      note: isSupabaseAdminConfigured() ? "Operational" : "Warning",
    },
    {
      label: "Email",
      ok: hasResendKey() || hasGoogleOAuth() || hasMicrosoftOAuth() || hasIonosSmtp(),
      note:
        hasResendKey() || hasGoogleOAuth() || hasMicrosoftOAuth() || hasIonosSmtp()
          ? "Operational"
          : "Warning",
    },
    { label: "AI", ok: hasClaudeKey(), note: hasClaudeKey() ? "Operational" : "Warning" },
  ];

  return (
    <>
      <PageHeader
        title={`${greeting()}`}
        description="Leads, Angebote, Rechnungen und Verträge."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/contracts/new" className="btn-ghost">
              Vertrag
            </Link>
            <Link href="/invoices/new" className="btn-ghost">
              Rechnung
            </Link>
            <Link href="/quotes/new" className="btn-primary">
              Angebot
            </Link>
          </div>
        }
      />

      <ReminderPulse />
      <FinancePulse />

      {stats.migrationMissing || connectedCount < VERCEL_CUSTOMER_SITES.length ? (
        <div className="glass mb-6 rounded-lg px-5 py-4">
          <p className="text-sm font-medium">Nächste Schritte</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-muted">
            <li>SQL-Migrationen in Supabase ausführen (init, website_connection, billing, ops).</li>
            <li>
              Unter{" "}
              <Link href="/integrations" className="underline hover:text-foreground">
                Verbindungen
              </Link>{" "}
              alle Live-Websites anbinden.
            </li>
            <li>API-Keys in den jeweiligen Vercel-Projekten als Server-Secrets setzen.</li>
            <li>
              Site-Patches aus <code className="font-mono text-foreground">integrations/sites</code> übernehmen
              oder <code className="font-mono text-foreground">npm run apply-site-patches</code> ausführen.
            </li>
          </ol>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Kunden" value={stats.customerCount} />
        <StatCard label="Websites" value={stats.websiteCount} hint={`${stats.activeWebsiteCount} aktiv`} />
        <StatCard
          label="Vercel live"
          value={`${connectedCount}/${VERCEL_CUSTOMER_SITES.length}`}
          hint="Katalog der produktiven Sites"
        />
        <StatCard label="Neue Leads" value={stats.newLeadCount} hint={`${stats.openLeadCount} offen`} />
      </div>

      <div className="mt-6">
        <Panel
          title="Live-Verbindungen"
          description="Welche Vercel-Projekte bereits an Client Lead Center senden dürfen."
          action={
            <Link href="/integrations" className="text-sm text-muted hover:text-foreground">
              Alle
            </Link>
          }
        >
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {matches.map(({ site, website }) => (
              <li key={site.slug} className="rounded-md border border-border bg-white/[0.03] px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <EntityMark name={site.companyName} size="sm" />
                    <p className="truncate text-sm font-medium">{site.companyName}</p>
                  </div>
                  <StatusBadge tone={website ? "success" : "warning"}>{website ? "OK" : "Offen"}</StatusBadge>
                </div>
                <p className="mt-2 truncate text-xs text-muted">{site.domain}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <RecentDocuments />
          <Panel
            title="Letzte Leads"
            action={
              <Link href="/leads" className="text-sm text-muted hover:text-foreground">
                Alle
              </Link>
            }
          >
          {stats.recentLeads.length === 0 ? (
            <EmptyState title="Keine Leads" description="Sobald eine Kundenwebsite Anfragen sendet, erscheinen sie hier." />
          ) : (
            <ul className="divide-y divide-border">
              {stats.recentLeads.map((lead) => {
                const customer = Array.isArray(lead.customers)
                  ? lead.customers[0]
                  : lead.customers;
                return (
                  <li key={lead.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link href={`/leads/${lead.id}`} className="text-sm font-medium hover:underline">
                        {lead.name}
                      </Link>
                      <p className="mt-1 truncate text-sm text-muted">
                        {customer?.company_name ?? "Unbekannter Kunde"} · {lead.email}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge tone={toneForLead(lead.status)}>{leadStatusLabel(lead.status)}</StatusBadge>
                      <p className="mt-1 text-xs text-subtle">{formatDateTime(lead.created_at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Kundenübersicht">
            {stats.customers.length === 0 ? (
              <p className="text-sm text-muted">Noch keine Kunden. Über Verbindungen anbinden.</p>
            ) : (
              <ul className="space-y-3">
                {stats.customers.slice(0, 6).map((customer) => (
                  <li key={customer.id} className="flex items-center justify-between gap-3">
                    <Link href={`/clients/${customer.id}`} className="flex min-w-0 items-center gap-2.5 text-sm hover:underline">
                      <EntityMark name={customer.company_name} size="sm" />
                      <span className="truncate">{customer.company_name}</span>
                    </Link>
                    <StatusBadge tone={customer.status === "active" ? "success" : "neutral"}>
                      {customer.status === "active" ? "Aktiv" : "Inaktiv"}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Systemstatus">
            <ul className="space-y-3">
              {system.map((item) => (
                <li key={item.label} className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <StatusBadge tone={item.ok ? "success" : "warning"}>{item.note}</StatusBadge>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Aktivitäten">
            {stats.activities.length === 0 ? (
              <p className="text-sm text-muted">Noch keine Aktivitäten.</p>
            ) : (
              <ul className="space-y-3">
                {stats.activities.map((item) => (
                  <li key={item.id} className="text-sm">
                    <span className="font-medium">{item.action}</span>
                    <span className="block text-xs text-subtle">{formatDateTime(item.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
