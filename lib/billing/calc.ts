import type { BusinessDocument, LineItem } from "./types";

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineNet(item: Pick<LineItem, "qty" | "unitPrice">): number {
  return round2((Number(item.qty) || 0) * (Number(item.unitPrice) || 0));
}

export function documentTotals(doc: Pick<BusinessDocument, "items" | "taxRate"> & { discountPercent?: number }) {
  const subtotal = round2(doc.items.reduce((sum, item) => sum + lineNet(item), 0));
  const discountPercent = Math.max(0, Number(doc.discountPercent) || 0);
  const discount = round2(subtotal * (discountPercent / 100));
  const net = round2(subtotal - discount);
  const tax = round2(net * ((Number(doc.taxRate) || 0) / 100));
  const gross = round2(net + tax);
  return { subtotal, discount, discountPercent, net, tax, gross };
}

export function padSequence(value: number): string {
  return String(Math.max(1, Math.floor(value))).padStart(4, "0");
}

export function formatDocumentNumber(prefix: string, year: number, sequence: number): string {
  const clean = (prefix || "NR").replace(/[^A-Z0-9]/gi, "").toUpperCase() || "NR";
  return `${clean}-${year}-${padSequence(sequence)}`;
}

export function isOpenReceivable(doc: Pick<BusinessDocument, "kind" | "status" | "archivedAt">): boolean {
  if (doc.kind !== "invoice" || doc.archivedAt) return false;
  return doc.status === "sent" || doc.status === "overdue";
}

export function isOverdueInvoice(
  doc: Pick<BusinessDocument, "kind" | "status" | "dueDate" | "archivedAt">,
  today = new Date().toISOString().slice(0, 10),
): boolean {
  if (doc.kind !== "invoice" || doc.archivedAt) return false;
  if (doc.status !== "sent" && doc.status !== "overdue") return false;
  return Boolean(doc.dueDate) && doc.dueDate < today;
}

export function isExpiredQuote(
  doc: Pick<BusinessDocument, "kind" | "status" | "dueDate" | "archivedAt">,
  today = new Date().toISOString().slice(0, 10),
): boolean {
  if (doc.kind !== "quote" || doc.archivedAt) return false;
  if (doc.status !== "sent" && doc.status !== "expired") return false;
  return Boolean(doc.dueDate) && doc.dueDate < today;
}

export function isExpiredContract(
  doc: Pick<BusinessDocument, "kind" | "status" | "dueDate" | "archivedAt">,
  today = new Date().toISOString().slice(0, 10),
): boolean {
  if (doc.kind !== "contract" || doc.archivedAt) return false;
  if (doc.status !== "active" && doc.status !== "signed" && doc.status !== "expired") return false;
  return Boolean(doc.dueDate) && doc.dueDate < today;
}
