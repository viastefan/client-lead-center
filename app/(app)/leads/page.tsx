import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { loadCustomers, loadLeads, loadWebsites } from "@/lib/data/workspace";
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
  const [leads, customers, websites] = await Promise.all([
    loadLeads({
      status: (filters.status as LeadStatus | "all" | undefined) ?? "all",
      customerId: filters.customerId,
      websiteId: filters.websiteId,
      priority: filters.priority as never,
      source: filters.source,
      query: filters.q,
      from: filters.from,
      to: filters.to,
    }),
    loadCustomers(),
    loadWebsites(),
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

      <form className="mb-6 grid gap-3 rounded-lg border border-border p-3 md:grid-cols-4">
        <select name="customerId" defaultValue={filters.customerId ?? ""} className="field">
          <option value="">Kunde</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.company_name}
            </option>
          ))}
        </select>
        <select name="websiteId" defaultValue={filters.websiteId ?? ""} className="field">
          <option value="">Website</option>
          {websites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        <select name="priority" defaultValue={filters.priority ?? ""} className="field">
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
          className="field"
        />
        <input type="hidden" name="status" value={status} />
        <button type="submit" className="btn-primary md:col-span-4 md:w-28">
          Filtern
        </button>
      </form>

      {leads.length === 0 ? (
        <EmptyState title="Keine Leads" description="Keine Anfragen für diesen Filter." />
      ) : (
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {leads.map((lead) => (
          <li key={lead.id}>
            <Link href={`/leads/${lead.id}`} className="row rounded-none">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{lead.name}</p>
                <p className="truncate text-[12px] text-muted">
                  {lead.customer?.company_name ?? "Kunde"} · {lead.email} · {formatDateTime(lead.created_at)}
                </p>
              </div>
              <StatusBadge>{leadStatusLabel(lead.status)}</StatusBadge>
              <StatusBadge>{priorityLabel(lead.priority)}</StatusBadge>
            </Link>
          </li>
        ))}
      </ul>
      )}
    </>
  );
}
