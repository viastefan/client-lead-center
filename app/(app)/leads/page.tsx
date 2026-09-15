import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { listLeads } from "@/lib/services/leads";
import { listCustomers } from "@/lib/services/customers";
import { listWebsites } from "@/lib/services/websites";
import { formatDateTime, leadStatusLabel, priorityLabel } from "@/lib/format";
import type { LeadStatus } from "@/types";

export const metadata = { title: "Leads" };

const STATUSES: { id: "all" | LeadStatus; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "new", label: "Neu" },
  { id: "in_progress", label: "In Bearbeitung" },
  { id: "waiting", label: "Warten" },
  { id: "replied", label: "Beantwortet" },
  { id: "qualified", label: "Qualified" },
  { id: "closed", label: "Geschlossen" },
];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    customerId?: string;
    websiteId?: string;
    priority?: string;
    source?: string;
    q?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const filters = await searchParams;
  const supabase = await createClient();
  const [leads, customers, websites] = await Promise.all([
    listLeads(supabase, {
      status: (filters.status as LeadStatus | "all" | undefined) ?? "all",
      customerId: filters.customerId,
      websiteId: filters.websiteId,
      priority: filters.priority as never,
      source: filters.source,
      query: filters.q,
      from: filters.from,
      to: filters.to,
    }),
    listCustomers(supabase),
    listWebsites(supabase),
  ]);

  const status = filters.status ?? "all";

  return (
    <>
      <PageHeader title="Leads" description="Alle eingehenden Anfragen über Kundenwebsites." />

      <div className="mb-6 flex gap-4 overflow-x-auto border-b border-border">
        {STATUSES.map((item) => (
          <Link
            key={item.id}
            href={`/leads?status=${item.id}`}
            className={`shrink-0 border-b-2 pb-3 text-sm ${
              status === item.id ? "border-foreground" : "border-transparent text-muted"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <form className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
        <select name="customerId" defaultValue={filters.customerId ?? ""} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
          <option value="">Kunde</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.company_name}
            </option>
          ))}
        </select>
        <select name="websiteId" defaultValue={filters.websiteId ?? ""} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
          <option value="">Website</option>
          {websites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        <select name="priority" defaultValue={filters.priority ?? ""} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
          <option value="">Priorität</option>
          <option value="low">Niedrig</option>
          <option value="normal">Normal</option>
          <option value="high">Hoch</option>
          <option value="urgent">Dringend</option>
        </select>
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Name, E-Mail, Text"
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
        />
        <input type="hidden" name="status" value={status} />
        <button type="submit" className="h-10 rounded-lg bg-accent text-sm text-white md:col-span-4 md:w-32">
          Filtern
        </button>
      </form>

      <div className="space-y-3">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/leads/${lead.id}`}
            className="block rounded-xl border border-border bg-card px-5 py-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{lead.name}</p>
                <p className="mt-1 text-sm text-muted">{lead.email}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{lead.message}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 text-xs">
                <StatusBadge>{leadStatusLabel(lead.status)}</StatusBadge>
                <StatusBadge>{priorityLabel(lead.priority)}</StatusBadge>
              </div>
            </div>
            <p className="mt-3 text-xs text-subtle">
              {lead.customer?.company_name ?? "Kunde"} · {lead.website?.domain ?? "Website"} · {formatDateTime(lead.created_at)}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
