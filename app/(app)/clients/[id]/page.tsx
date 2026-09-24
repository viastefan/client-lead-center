import { CustomerWorkspace } from "@/components/crm/customer-workspace";
import { coerceDirectoryCustomer } from "@/lib/crm/types";
import { loadCustomer, loadLeads, loadWebsitesForCustomer } from "@/lib/data/workspace";

export const metadata = { title: "Kunde" };

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await loadCustomer(id);
  const [websites, leads] = await Promise.all([
    customer ? loadWebsitesForCustomer(id) : Promise.resolve([]),
    loadLeads({ customerId: id }),
  ]);

  return (
    <CustomerWorkspace
      id={id}
      seed={
        customer
          ? coerceDirectoryCustomer({
              id: customer.id,
              companyName: customer.company_name,
              contactName: customer.contact_name,
              email: customer.contact_email,
              phone: customer.contact_phone ?? "",
              address: "",
              domain: websites[0]?.domain ?? "",
              websiteUrl: websites[0] ? `https://${websites[0].domain.replace(/^https?:\/\//, "")}` : "",
              source: "website",
              notes: customer.notes ?? "",
              status: customer.status,
            })
          : null
      }
      websites={websites.map((site) => ({ id: site.id, name: site.name, domain: site.domain }))}
      leads={leads.slice(0, 8).map((lead) => ({ id: lead.id, name: lead.name, email: lead.email, status: lead.status }))}
    />
  );
}
