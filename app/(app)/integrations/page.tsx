import Link from "next/link";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { CopyBlock } from "@/components/copy-block";
import { ProvisionSitesButton } from "@/components/provision-sites-button";
import { isPreviewMode, loadWebsites } from "@/lib/data/workspace";
import { matchCatalogToWebsites, VERCEL_CUSTOMER_SITES } from "@/lib/catalog/vercel-sites";
import {
  contactRouteSnippet,
  envSnippet,
  leadApiUrl,
  submitLeadSnippet,
} from "@/lib/integrations/snippets";
import { isAdminRole, requireSessionUser } from "@/lib/auth/session";
import { hasClaudeKey, hasGoogleOAuth, hasMicrosoftOAuth, hasResendKey, isSupabaseAdminConfigured } from "@/lib/env";

export const metadata = { title: "Verbindungen" };

export default async function IntegrationsPage() {
  const user = await requireSessionUser();
  const websites = await loadWebsites();
  const migrationMissing = false;
  const preview = isPreviewMode();

  const matches = matchCatalogToWebsites(websites);
  const connectedCount = matches.filter((item) => item.website).length;
  const canProvision = isAdminRole(user.profile?.role);
  const apiUrl = leadApiUrl();

  const services = [
    { name: "Lead API", status: "operational" as const, note: apiUrl },
    { name: "Supabase PostgreSQL", status: "operational" as const, note: "Persistenter Speicher" },
    {
      name: "Supabase Storage",
      status: isSupabaseAdminConfigured() ? ("operational" as const) : ("warning" as const),
      note: "Bucket attachments",
    },
    {
      name: "Gmail OAuth",
      status: hasGoogleOAuth() ? ("operational" as const) : ("warning" as const),
      note: "V1 vorbereitet",
    },
    {
      name: "Microsoft 365 OAuth",
      status: hasMicrosoftOAuth() ? ("operational" as const) : ("warning" as const),
      note: "V1 vorbereitet",
    },
    {
      name: "Resend",
      status: hasResendKey() ? ("operational" as const) : ("warning" as const),
      note: "System-Mails",
    },
    {
      name: "Claude",
      status: hasClaudeKey() ? ("operational" as const) : ("warning" as const),
      note: "Analyse-Adapter",
    },
  ];

  return (
    <>
      <PageHeader
        title="Verbindungen"
        description="Alle aktuell live stehenden Kundenwebsites auf Vercel an die zentrale Lead-API anbinden. Die Sites bleiben eigene Projekte."
        action={
          <StatusBadge tone={connectedCount === VERCEL_CUSTOMER_SITES.length ? "success" : "warning"}>
            {connectedCount}/{VERCEL_CUSTOMER_SITES.length} angebunden
          </StatusBadge>
        }
      />

      {migrationMissing ? (
        <div className="mb-6 rounded-2xl border border-warning/30 bg-warning/10 px-5 py-4 text-sm leading-6">
          Die Connection-Migration fehlt noch. Bitte in Supabase SQL Editor ausführen:{" "}
          <code className="font-mono">supabase/migrations/20260915180000_website_connection.sql</code>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel
          title="Live Vercel-Websites"
          description="Katalog der produktiven Kundenprojekte. Anbindung legt Kunde, Website, Allowlist und API-Key in Supabase an."
          action={canProvision && !preview ? <ProvisionSitesButton /> : null}
        >
          <ul className="divide-y divide-border">
            {matches.map(({ site, website }) => (
              <li key={site.slug} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{site.companyName}</p>
                  <p className="mt-1 text-sm text-muted">{site.domain}</p>
                  <p className="mt-1 truncate text-xs text-subtle">
                    {site.githubRepo} · {site.vercelUrl.replace(/^https?:\/\//, "")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {website ? (
                    <Link href={`/websites/${website.id}`} className="text-sm text-muted hover:text-foreground hover:underline">
                      Kit öffnen
                    </Link>
                  ) : (
                    <span className="text-sm text-subtle">Noch nicht in CLC</span>
                  )}
                  <StatusBadge tone={website ? "success" : "warning"}>
                    {website ? "Verbunden" : "Offen"}
                  </StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-6">
          <Panel title="Lead-API" description="Kundenwebsites POSTEN serverseitig. Der Key bleibt im jeweiligen Vercel-Projekt.">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-subtle">Endpoint</dt>
                <dd className="mt-1 break-all font-mono text-xs">{apiUrl}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-subtle">Auth</dt>
                <dd className="mt-1">Header x-api-key</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-subtle">Origin</dt>
                <dd className="mt-1 text-muted">Custom Domain, Apex, www und *.vercel.app Previews</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Dienste">
            <ul className="space-y-3">
              {services.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">{item.note}</p>
                  </div>
                  <StatusBadge tone={item.status === "operational" ? "success" : "warning"}>
                    {item.status === "operational" ? "Operational" : "Warning"}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <CopyBlock label="app/api/contact/route.ts" value={contactRouteSnippet()} language="ts" />
        <CopyBlock label="Formular-Client" value={submitLeadSnippet()} language="ts" />
      </div>

      {matches.some((item) => item.website) ? (
        <div className="mt-6">
          <Panel title="Env-Vorlagen" description="Ohne API-Key. Den Klartext-Key nach dem Anbinden oder Rotieren einsetzen.">
            <div className="grid gap-4 lg:grid-cols-2">
              {matches
                .flatMap(({ site, website }) => (website ? [{ site, website }] : []))
                .map(({ site, website }) => (
                  <CopyBlock
                    key={website.id}
                    label={site.companyName}
                    value={envSnippet(website)}
                  />
                ))}
            </div>
          </Panel>
        </div>
      ) : null}
    </>
  );
}
