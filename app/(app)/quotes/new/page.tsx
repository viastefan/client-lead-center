import { DocumentEditor } from "@/components/billing/document-editor";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const { customer } = await searchParams;
  return <DocumentEditor kind="quote" presetCustomerId={customer} />;
}
