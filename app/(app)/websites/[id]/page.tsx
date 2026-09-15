import { notFound } from "next/navigation";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { RotateApiKeyButton } from "@/components/rotate-api-key-button";
import { createClient } from "@/lib/supabase/server";
import { getWebsite } from "@/lib/services/websites";
import { formatDateTime, websiteStatusLabel } from "@/lib/format";

export const metadata = { title: "Website" };

export default async function WebsiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const website = await getWebsite(supabase, id);
  if (!website) notFound();

  const rows = [
    ["Customer ID", website.customer_id],
    ["Website ID", website.id],
    ["API Status", website.active ? "Bereit" : "Inaktiv"],
    ["Last Request", formatDateTime(website.last_request_at)],
    ["Last Lead", formatDateTime(website.last_lead_at)],
    ["Domain", website.domain],
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

      <Panel title="Verbindung">
        <dl className="grid gap-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-subtle">{label}</dt>
              <dd className="mt-1 break-all font-mono text-sm">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm leading-6 text-muted">
          Der API-Key wird nur als Hash gespeichert. Nach dem Generieren ist der Klartext ein einziges Mal sichtbar.
        </p>
        <div className="mt-4">
          <RotateApiKeyButton websiteId={website.id} />
        </div>
      </Panel>
    </>
  );
}
