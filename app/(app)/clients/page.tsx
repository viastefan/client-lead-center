import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { listCustomers } from "@/lib/services/customers";
import { customerStatusLabel, emailStatusLabel, formatDateTime } from "@/lib/format";

export const metadata = { title: "Kunden" };

export default async function ClientsPage() {
  const supabase = await createClient();
  const customers = await listCustomers(supabase);

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

      <div className="glass hidden overflow-hidden rounded-3xl md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-subtle">
            <tr>
              <th className="px-5 py-3 font-medium">Kunde</th>
              <th className="px-5 py-3 font-medium">Websites</th>
              <th className="px-5 py-3 font-medium">Leads</th>
              <th className="px-5 py-3 font-medium">E-Mail</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Letzte Aktivität</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-border last:border-0 hover:bg-background/70">
                <td className="px-5 py-4">
                  <Link href={`/clients/${customer.id}`} className="font-medium hover:underline">
                    {customer.company_name}
                  </Link>
                  <p className="mt-1 text-muted">{customer.contact_name}</p>
                </td>
                <td className="px-5 py-4">{customer.website_count}</td>
                <td className="px-5 py-4">{customer.lead_count}</td>
                <td className="px-5 py-4">
                  {customer.email_status ? emailStatusLabel(customer.email_status) : "—"}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge tone={customer.status === "active" ? "success" : "neutral"}>
                    {customerStatusLabel(customer.status)}
                  </StatusBadge>
                </td>
                <td className="px-5 py-4 text-muted">{formatDateTime(customer.last_activity_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {customers.map((customer) => (
          <Link
            key={customer.id}
            href={`/clients/${customer.id}`}
            className="glass block rounded-3xl px-4 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{customer.company_name}</p>
              <StatusBadge tone={customer.status === "active" ? "success" : "neutral"}>
                {customerStatusLabel(customer.status)}
              </StatusBadge>
            </div>
            <p className="mt-2 text-sm text-muted">
              {customer.website_count} Websites · {customer.lead_count} Leads
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
