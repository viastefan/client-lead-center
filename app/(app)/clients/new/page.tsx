import { PageHeader } from "@/components/ui";
import { CreateCustomerForm } from "@/components/create-customer-form";

export const metadata = { title: "Neuer Kunde" };

export default function NewClientPage() {
  return (
    <>
      <PageHeader title="Neuer Empfänger" description="Wix, Website oder manuell. Der Kontakt steht danach in der Empfängerwahl für Angebot, Rechnung und Vertrag." />
      <CreateCustomerForm />
    </>
  );
}
