import { PageHeader } from "@/components/ui";
import { CreateCustomerForm } from "@/components/create-customer-form";

export const metadata = { title: "Neuer Kunde" };

export default function NewClientPage() {
  return (
    <>
      <PageHeader title="Neuer Kunde" description="Manuell anlegen. Live-Vercel-Sites besser über Verbindungen anbinden." />
      <CreateCustomerForm />
    </>
  );
}
