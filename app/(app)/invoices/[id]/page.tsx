"use client";

import { use } from "react";
import { DocumentEditor } from "@/components/billing/document-editor";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DocumentEditor kind="invoice" id={id} />;
}
