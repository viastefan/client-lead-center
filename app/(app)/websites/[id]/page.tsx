import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { CopyBlock } from "@/components/copy-block";
import { RotateApiKeyButton } from "@/components/rotate-api-key-button";
import { isPreviewMode, loadWebsite } from "@/lib/data/workspace";
import { findCatalogSite } from "@/lib/catalog/vercel-sites";
import {
  allowedHostsForWebsite,
  contactRouteSnippet,
  curlSnippet,
  envSnippet,
  leadApiUrl,
  submitLeadSnippet,
} from "@/lib/integrations/snippets";
import { formatDateTime, websiteStatusLabel } from "@/lib/format";

export const metadata = { title: "Website" };

export default async function WebsiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const website = await loadWebsite(id);
  if (!website) notFound();
  const preview = isPreviewMode();

  const catalog = findCatalogSite({
    vercelProject: website.vercel_project,
    domain: website.domain,
    githubRepo: website.github_repo,
  });
  const hosts = allowedHostsForWebsite(website);
  const vercelUrl = website.vercel_url ?? catalog?.vercelUrl ?? null;
  const githubRepo = website.github_repo ?? catalog?.githubRepo ?? null;

  const rows = [
    ["Kunde", website.customer?.company_name ?? website.customer_id],
    ["Customer ID", website.customer_id],
    ["Website ID", website.id],
    ["Domain", website.domain],
    ["Vercel", website.vercel_project ?? catalog?.slug ?? "—"],
    ["GitHub", githubRepo ?? "—"],
    ["API", website.active ? "Bereit" : "Inaktiv"],
    ["Letzter Request", formatDateTime(website.last_request_at)],
    ["Letzter Lead", formatDateTime(website.last_lead_at)],
  ];

  return (
    <>
      <PageHeader
        title={website.name}
        description={website.customer?.company_name ?? website.domain}
        action={
          <StatusBadge tone={website.active ? "success" : "warning"}>
            {websiteStatusLabel(website.status)}
          </StatusBadge>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Connection Kit"
          description="Serverseitig auf der Kundenwebsite einbauen. Der API-Key bleibt ein Server-Secret."
        >
          <div className="space-y-4">
            <CopyBlock label=".env der Kundenwebsite" value={envSnippet(website)} />
            <CopyBlock label="app/api/contact/route.ts" value={contactRouteSnippet()} language="ts" />
            <CopyBlock label="Formular-Client" value={submitLeadSnippet()} language="ts" />
            <CopyBlock label="cURL-Test" value={curlSnippet(website)} />
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Verbindung">
            <dl className="grid gap-4">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-wide text-subtle">{label}</dt>
                  <dd className="mt-1 break-all font-mono text-[13px]">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              {vercelUrl ? (
                <a href={vercelUrl} className="text-muted hover:text-foreground hover:underline" target="_blank" rel="noreferrer">
                  Vercel öffnen
                </a>
              ) : null}
              {githubRepo ? (
                <a
                  href={`https://github.com/${githubRepo}`}
                  className="text-muted hover:text-foreground hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              ) : null}
              <Link href="/integrations" className="text-muted hover:text-foreground hover:underline">
                Alle Verbindungen
              </Link>
            </div>
          </Panel>

          <Panel title="Allowlist" description="Origin- und Referer-Hosts, inkl. Custom Domain und Vercel-Previews.">
            <ul className="flex flex-wrap gap-2">
              {hosts.map((host) => (
                <li key={host} className="rounded-full bg-background px-2.5 py-1 font-mono text-[11px] text-muted ring-1 ring-border">
                  {host}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-5 text-subtle">
              Endpoint: {leadApiUrl()}
            </p>
          </Panel>

          <Panel title="API-Key">
            <p className="text-sm leading-6 text-muted">
              Der Key wird nur als Hash gespeichert. Nach dem Generieren ist der Klartext ein einziges Mal sichtbar.
            </p>
            <div className="mt-4">
              {preview ? (
                <p className="text-sm text-subtle">In der Vorschau nicht verfügbar. Nach Supabase-Connect hier rotieren.</p>
              ) : (
                <RotateApiKeyButton websiteId={website.id} customerId={website.customer_id} />
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
