import Link from "next/link";
import { EmptyState, PageHeader, Panel, StatusBadge, StatusDot } from "@/components/ui";
import { AttentionList } from "@/components/ops/attention-list";
import { MonitorStrip } from "@/components/ops/monitor-strip";
import { FinancePulse } from "@/components/billing/finance-pulse";
import { RecentDocuments } from "@/components/billing/recent-documents";
import { ActivityLog } from "@/components/ops/activity-log";
import { loadDashboardStats, loadLeads } from "@/lib/data/workspace";
import { matchCatalogToWebsites, VERCEL_CUSTOMER_SITES } from "@/lib/catalog/vercel-sites";
import { formatDateTime, leadStatusLabel } from "@/lib/format";
import type { InboxLead } from "@/lib/ops/inbox";
import {
  hasClaudeKey,
  hasGoogleOAuth,
  hasIonosSmtp,
  hasMicrosoftOAuth,
  hasResendKey,
  isSupabaseAdminConfigured,
} from "@/lib/env";

export const metadata = { title: "Übersicht" };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

export default async function DashboardPage() {
  const [stats, leads] = await Promise.all([loadDashboardStats(), loadLeads()]);
  const matches = matchCatalogToWebsites(stats.websites);
  const connectedCount = matches.filter((item) => item.website).length;
  const inboxLeads: InboxLead[] = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    status: lead.status,
    customerName: lead.customer?.company_name ?? "Kunde",
    createdAt: lead.created_at,
    customerId: lead.customer_id,
  }));

  const system = [
    { label: "API", ok: true },
    { label: "Database", ok: !stats.migrationMissing },
    { label: "Storage", ok: isSupabaseAdminConfigured() },
    { label: "E-Mail", ok: hasResendKey() || hasGoogleOAuth() || hasMicrosoftOAuth() || hasIonosSmtp() },
    { label: "AI", ok: hasClaudeKey() },
  ];

  return (
    <>
      <PageHeader
        title={greeting()}
        description="Eine Inbox. Acht Sites. Finanzen und Leads in einer Linie."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/monitor" className="btn-ghost">
              Überwachung
            </Link>
            <Link href="/quotes/new" className="btn-primary">
              Angebot
            </Link>
          </div>
        }
      />

      <MonitorStrip />
      <div className="mb-6">
        <AttentionList leads={inboxLeads} />
      </div>
      <FinancePulse />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <RecentDocuments />
          <Panel
            title="Leads"
            action={
              <Link href="/leads" className="text-[12px] text-muted hover:text-foreground">
                Alle
              </Link>
            }
          >
            {stats.recentLeads.length === 0 ? (
              <EmptyState title="Keine Leads" description="Sobald eine Kundenwebsite Anfragen sendet, erscheinen sie hier." />
            ) : (
              <ul>
                {stats.recentLeads.map((lead) => {
                  const customer = Array.isArray(lead.customers) ? lead.customers[0] : lead.customers;
                  return (
                    <li key={lead.id} className="border-b border-border last:border-0">
                      <Link href={`/leads/${lead.id}`} className="row rounded-none px-0">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{lead.name}</p>
                          <p className="truncate text-[12px] text-muted">
                            {customer?.company_name ?? "Kunde"} · {lead.email}
                          </p>
                        </div>
                        <StatusBadge>{leadStatusLabel(lead.status)}</StatusBadge>
                        <span className="hidden text-[12px] text-subtle sm:block">{formatDateTime(lead.created_at)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Sites" action={<Link href="/monitor" className="text-[12px] text-muted hover:text-foreground">Live-Check</Link>}>
            <ul>
              {matches.map(({ site, website }) => (
                <li key={site.slug} className="flex items-center gap-2 py-2 text-[13px]">
                  <StatusDot tone={website ? "success" : "warning"} />
                  <span className="min-w-0 flex-1 truncate">{site.companyName}</span>
                  <span className="text-[12px] text-subtle">{website ? "an" : "offen"}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] text-muted">
              Katalog {connectedCount}/{VERCEL_CUSTOMER_SITES.length} angebunden
            </p>
          </Panel>
          <Panel title="Systeme">
            <ul>
              {system.map((item) => (
                <li key={item.label} className="flex items-center justify-between py-2 text-[13px]">
                  <span className="flex items-center gap-2">
                    <StatusDot tone={item.ok ? "success" : "warning"} />
                    {item.label}
                  </span>
                  <span className="text-[12px] text-subtle">{item.ok ? "ok" : "offen"}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <ActivityLog />
        </div>
      </div>
    </>
  );
}
