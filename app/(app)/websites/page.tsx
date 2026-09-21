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
          <div className="hidden overflow-hidden rounded-lg border border-border md:block">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-border text-[11px] text-subtle">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Website</th>
                  <th className="px-4 py-2.5 font-medium">Kunde</th>
                  <th className="px-4 py-2.5 font-medium">Domain</th>
                  <th className="px-4 py-2.5 font-medium">Vercel</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Letzter Lead</th>
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
                    <tr key={site.id} className="border-b border-border last:border-0 hover:bg-white/[0.03]">
                      <td className="px-4 py-2.5">
                        <Link href={`/websites/${site.id}`} className="font-medium">
                          {site.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-muted">{site.customer?.company_name ?? "—"}</td>
                      <td className="px-4 py-2.5">{site.domain}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge tone={catalog || site.vercel_project ? "success" : "warning"}>
                          {catalog || site.vercel_project ? "Live" : "Manuell"}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge tone={site.active ? "success" : "neutral"}>
                          {websiteStatusLabel(site.status)}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-2.5 text-muted">{formatDateTime(site.last_lead_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border md:hidden">
            {websites.map((site) => (
              <li key={site.id}>
                <Link href={`/websites/${site.id}`} className="row rounded-none">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{site.name}</p>
                    <p className="truncate text-[12px] text-muted">
                      {site.customer?.company_name} · {site.domain}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
