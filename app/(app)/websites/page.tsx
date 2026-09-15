import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { listWebsites } from "@/lib/services/websites";
import { formatDateTime, websiteStatusLabel } from "@/lib/format";

export const metadata = { title: "Websites" };

export default async function WebsitesPage() {
  const supabase = await createClient();
  const websites = await listWebsites(supabase);

  return (
    <>
      <PageHeader title="Websites" description="Technische Verbindungen der Kundenwebsites zur zentralen Lead-API." />

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-subtle">
            <tr>
              <th className="px-5 py-3 font-medium">Website</th>
              <th className="px-5 py-3 font-medium">Kunde</th>
              <th className="px-5 py-3 font-medium">Domain</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Letzter Lead</th>
              <th className="px-5 py-3 font-medium">API</th>
            </tr>
          </thead>
          <tbody>
            {websites.map((site) => (
              <tr key={site.id} className="border-b border-border last:border-0">
                <td className="px-5 py-4">
                  <Link href={`/websites/${site.id}`} className="font-medium hover:underline">
                    {site.name}
                  </Link>
                </td>
                <td className="px-5 py-4 text-muted">{site.customer?.company_name ?? "—"}</td>
                <td className="px-5 py-4">{site.domain}</td>
                <td className="px-5 py-4">
                  <StatusBadge tone={site.active ? "success" : "neutral"}>
                    {websiteStatusLabel(site.status)}
                  </StatusBadge>
                </td>
                <td className="px-5 py-4 text-muted">{formatDateTime(site.last_lead_at)}</td>
                <td className="px-5 py-4">{site.active ? "Bereit" : "Inaktiv"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {websites.map((site) => (
          <Link key={site.id} href={`/websites/${site.id}`} className="block rounded-xl border border-border bg-card px-4 py-4">
            <p className="font-medium">{site.name}</p>
            <p className="mt-1 text-sm text-muted">
              {site.customer?.company_name} · {site.domain}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
