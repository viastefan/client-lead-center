import { DOCUMENT_KINDS, DOCUMENT_STATUSES, TEMPLATE_IDS, type BusinessDocument, type DocumentKind, type DocumentStatus, type LineItem, type TemplateId } from "./types";
import { isExpiredContract, isExpiredQuote, isOverdueInvoice } from "./calc";
import { newPaymentToken } from "./payment";

function asKind(value: unknown): DocumentKind {
  return DOCUMENT_KINDS.includes(value as DocumentKind) ? (value as DocumentKind) : "invoice";
}

function asStatus(value: unknown): DocumentStatus {
  return DOCUMENT_STATUSES.includes(value as DocumentStatus) ? (value as DocumentStatus) : "draft";
}

function asTemplate(value: unknown): TemplateId {
  return TEMPLATE_IDS.includes(value as TemplateId) ? (value as TemplateId) : "atelier";
}

function asItems(value: unknown): LineItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const row = item as Partial<LineItem>;
    return {
      id: typeof row.id === "string" && row.id ? row.id : `item-${index}`,
      title: String(row.title ?? ""),
      description: String(row.description ?? ""),
      qty: Number(row.qty) || 0,
      unit: String(row.unit ?? "Stück"),
      unitPrice: Number(row.unitPrice) || 0,
    };
  });
}

export function coerceDocument(raw: Partial<BusinessDocument> & { id: string }): BusinessDocument {
  const issueDate = raw.issueDate || new Date().toISOString().slice(0, 10);
  return {
    id: raw.id,
    kind: asKind(raw.kind),
    number: raw.number ?? "",
    status: asStatus(raw.status),
    templateId: asTemplate(raw.templateId),
    customerId: raw.customerId ?? "",
    customerName: raw.customerName ?? "",
    customerContact: raw.customerContact ?? "",
    customerEmail: raw.customerEmail ?? "",
    customerAddress: raw.customerAddress ?? "",
    customerVatId: raw.customerVatId ?? "",
    customerPhone: raw.customerPhone ?? "",
    issueDate,
    dueDate: raw.dueDate ?? issueDate,
    serviceDate: raw.serviceDate || issueDate,
    intro: raw.intro ?? "",
    notes: raw.notes ?? "",
    taxRate: Number(raw.taxRate) || 0,
    discountPercent: Math.max(0, Number(raw.discountPercent) || 0),
    currency: "EUR",
    items: asItems(raw.items),
    paymentToken: raw.paymentToken || newPaymentToken(),
    sentAt: raw.sentAt ?? null,
    paidAt: raw.paidAt ?? null,
    lastMailedAt: raw.lastMailedAt ?? null,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    archivedAt: raw.archivedAt ?? null,
    convertedFromId: raw.convertedFromId ?? null,
  };
}

export function applyDocumentLifecycle(doc: BusinessDocument, today = new Date().toISOString().slice(0, 10)): BusinessDocument {
  if (isOverdueInvoice(doc, today) && doc.status !== "overdue") {
    return { ...doc, status: "overdue" };
  }
  if (isExpiredQuote(doc, today) && doc.status !== "expired") {
    return { ...doc, status: "expired" };
  }
  if (isExpiredContract(doc, today) && doc.status !== "expired") {
    return { ...doc, status: "expired" };
  }
  return doc;
}
