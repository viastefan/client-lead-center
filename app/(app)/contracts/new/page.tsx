import { DocumentEditor } from "@/components/billing/document-editor";

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const { customer } = await searchParams;
  return <DocumentEditor kind="contract" presetCustomerId={customer} />;
}
