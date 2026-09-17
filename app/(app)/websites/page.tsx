import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { loadWebsites } from "@/lib/data/workspace";
import { findCatalogSite } from "@/lib/catalog/vercel-sites";
import { formatDateTime, websiteStatusLabel } from "@/lib/format";

export const metadata = { title: "Websites" };

export default async function WebsitesPage() {
  const websites = await loadWebsites();
  const migrationMissing = false;

  return (
    <>
      <PageHeader
        title="Websites"
        description="Technische Verbindungen der Kundenwebsites zur zentralen Lead-API."
        action={
          <Link
            href="/integrations"
            className="btn-primary"
          >
            Verbindungen
          </Link>
        }
      />

      {migrationMissing ? (
        <EmptyState
          title="Connection-Migration fehlt"
          description="Bitte supabase/migrations/20260915180000_website_connection.sql im Supabase SQL Editor ausführen."
        />
      ) : websites.length === 0 ? (
        <EmptyState
          title="Keine Websites"
          description="Binden Sie die Live-Projekte auf Vercel über Verbindungen an. Danach erscheinen sie hier."
          action={
            <Link href="/integrations" className="text-sm text-muted hover:text-foreground hover:underline">
              Zu den Verbindungen
            </Link>
          }
        />
      ) : (
        <>
          <div className="glass hidden overflow-hidden rounded-lg md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-subtle">
                <tr>
                  <th className="px-5 py-3 font-medium">Website</th>
                  <th className="px-5 py-3 font-medium">Kunde</th>
                  <th className="px-5 py-3 font-medium">Domain</th>
                  <th className="px-5 py-3 font-medium">Vercel</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Letzter Lead</th>
                </tr>
              </thead>
              <tbody>
                {websites.map((site) => {
                  const catalog = findCatalogSite({
                    vercelProject: site.vercel_project,
                    domain: site.domain,
                    githubRepo: site.github_repo,
                  });
                  return (
                    <tr key={site.id} className="border-b border-border last:border-0 hover:bg-background/70">
                      <td className="px-5 py-4">
                        <Link href={`/websites/${site.id}`} className="font-medium hover:underline">
                          {site.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-muted">{site.customer?.company_name ?? "—"}</td>
                      <td className="px-5 py-4">{site.domain}</td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={catalog || site.vercel_project ? "success" : "warning"}>
                          {catalog || site.vercel_project ? "Live" : "Manuell"}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={site.active ? "success" : "neutral"}>
                          {websiteStatusLabel(site.status)}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-4 text-muted">{formatDateTime(site.last_lead_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {websites.map((site) => (
              <Link key={site.id} href={`/websites/${site.id}`} className="glass block rounded-lg px-4 py-4">
                <p className="font-medium">{site.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {site.customer?.company_name} · {site.domain}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
