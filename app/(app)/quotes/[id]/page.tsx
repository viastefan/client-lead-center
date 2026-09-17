"use client";

import { use } from "react";
import { DocumentEditor } from "@/components/billing/document-editor";

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DocumentEditor kind="quote" id={id} />;
}
