import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/ui";
import { loadCustomers } from "@/lib/data/workspace";
import { customerStatusLabel, emailStatusLabel, formatDateTime } from "@/lib/format";

export const metadata = { title: "Kunden" };

export default async function ClientsPage() {
  const customers = await loadCustomers();

  return (
    <>
      <PageHeader
        title="Kunden"
        description="Mandanten, Websites und Lead-Volumen an einem Ort."
        action={
          <Link
            href="/clients/new"
            className="btn-primary"
          >
            + Kunde
          </Link>
        }
      />

      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-border text-[11px] text-subtle">
            <tr>
              <th className="px-4 py-2.5 font-medium">Kunde</th>
              <th className="px-4 py-2.5 font-medium">Websites</th>
              <th className="px-4 py-2.5 font-medium">Leads</th>
              <th className="px-4 py-2.5 font-medium">E-Mail</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Aktivität</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-border last:border-0 hover:bg-white/[0.03]">
                <td className="px-4 py-2.5">
                  <Link href={`/clients/${customer.id}`} className="font-medium">
                    {customer.company_name}
                  </Link>
                  <p className="text-[12px] text-muted">{customer.contact_name}</p>
                </td>
                <td className="px-4 py-2.5 tabular-nums">{customer.website_count}</td>
                <td className="px-4 py-2.5 tabular-nums">{customer.lead_count}</td>
                <td className="px-4 py-2.5 text-muted">
                  {customer.email_status ? emailStatusLabel(customer.email_status) : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge tone={customer.status === "active" ? "success" : "neutral"}>
                    {customerStatusLabel(customer.status)}
                  </StatusBadge>
                </td>
                <td className="px-4 py-2.5 text-muted">{formatDateTime(customer.last_activity_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border md:hidden">
        {customers.map((customer) => (
          <li key={customer.id}>
            <Link href={`/clients/${customer.id}`} className="row rounded-none">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{customer.company_name}</p>
                <p className="text-[12px] text-muted">
                  {customer.website_count} Sites · {customer.lead_count} Leads
                </p>
              </div>
              <StatusBadge tone={customer.status === "active" ? "success" : "neutral"}>
                {customerStatusLabel(customer.status)}
              </StatusBadge>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
