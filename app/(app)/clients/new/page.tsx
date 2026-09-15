import { PageHeader } from "@/components/ui";
import { CreateCustomerForm } from "@/components/create-customer-form";

export const metadata = { title: "Neuer Kunde" };

export default function NewClientPage() {
  return (
    <>
      <PageHeader title="Neuer Kunde" description="Mandant anlegen. Websites und API-Keys folgen im nächsten Schritt." />
      <CreateCustomerForm />
    </>
  );
}
