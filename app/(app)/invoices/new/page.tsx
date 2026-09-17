import { DocumentEditor } from "@/components/billing/document-editor";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const { customer } = await searchParams;
  return <DocumentEditor kind="invoice" presetCustomerId={customer} />;
}
