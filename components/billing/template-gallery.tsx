"use client";

import { DocumentPreview } from "@/components/billing/document-preview";
import { TEMPLATE_META } from "@/lib/billing/labels";
import { coerceDocument } from "@/lib/billing/coerce";
import { useBilling } from "@/lib/billing/store";
import type { TemplateId } from "@/lib/billing/types";

const SAMPLE = coerceDocument({
  id: "template-sample",
  kind: "invoice",
  number: "RE-2026-0000",
  status: "draft",
  customerName: "Beispiel GmbH",
  customerContact: "Anna Keller",
  customerEmail: "anna@example.de",
  customerAddress: "Maximilianstraße 1\n80331 München",
  issueDate: "2026-09-17",
  dueDate: "2026-10-01",
  intro: "Rechnung für erbrachte Leistungen.",
  notes: "Bitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer.",
  taxRate: 19,
  items: [
    {
      id: "sample-1",
      title: "Monatliche Betreuung",
      description: "Operations und Lead-Routing.",
      qty: 1,
      unit: "Monat",
      unitPrice: 890,
    },
  ],
  createdAt: "2026-09-17T09:00:00.000Z",
  updatedAt: "2026-09-17T09:00:00.000Z",
  paymentToken: "paysample01",
});

export function TemplateGallery({
  value,
  onChange,
}: {
  value: TemplateId;
  onChange: (templateId: TemplateId) => void;
}) {
  const { company } = useBilling();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {(Object.keys(TEMPLATE_META) as TemplateId[]).map((templateId) => (
        <button
          key={templateId}
          type="button"
          onClick={() => onChange(templateId)}
          className={`overflow-hidden rounded-[24px] border text-left transition ${
            value === templateId ? "border-white/30 ring-1 ring-white/20" : "border-border hover:border-white/20"
          }`}
        >
          <div className="template-thumb">
            <DocumentPreview
              document={{ ...SAMPLE, templateId }}
              company={company}
              templateId={templateId}
            />
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-medium">{TEMPLATE_META[templateId].name}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{TEMPLATE_META[templateId].note}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
