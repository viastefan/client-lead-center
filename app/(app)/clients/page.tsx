import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { CustomerBoard } from "@/components/crm/customer-board";
import { loadCustomers } from "@/lib/data/workspace";
import { coerceDirectoryCustomer } from "@/lib/crm/types";

export const metadata = { title: "Kunden" };

export default async function ClientsPage() {
  const customers = await loadCustomers();
  const serverCustomers = customers.map((customer) =>
    coerceDirectoryCustomer({
      id: customer.id,
      companyName: customer.company_name,
      contactName: customer.contact_name,
      email: customer.contact_email,
      phone: customer.contact_phone ?? "",
      address: "",
      domain: "",
      websiteUrl: "",
      source: "website",
      notes: customer.notes ?? "",
      status: customer.status,
    }),
  );

  return (
    <>
      <PageHeader
        title="Kunden"
        description="Website-Mandanten bleiben in der Datenbank. Wix-Shops und weitere Empfänger legen Sie an und wählen sie direkt auf Angebot, Rechnung und Vertrag."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/emails" className="btn-ghost">
              Rundmail
            </Link>
            <Link href="/clients/new" className="btn-primary">
              + Empfänger
            </Link>
          </div>
        }
      />
      <CustomerBoard serverCustomers={serverCustomers} />
    </>
  );
}
