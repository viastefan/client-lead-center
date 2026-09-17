import type { BusinessDocument, LineItem } from "./types";

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineNet(item: Pick<LineItem, "qty" | "unitPrice">): number {
  return round2((Number(item.qty) || 0) * (Number(item.unitPrice) || 0));
}

export function documentTotals(doc: Pick<BusinessDocument, "items" | "taxRate">) {
  const net = round2(doc.items.reduce((sum, item) => sum + lineNet(item), 0));
  const tax = round2(net * ((Number(doc.taxRate) || 0) / 100));
  const gross = round2(net + tax);
  return { net, tax, gross };
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
  return doc.status === "sent" || doc.status === "overdue" || doc.status === "draft";
}

export function isOverdueInvoice(
  doc: Pick<BusinessDocument, "kind" | "status" | "dueDate" | "archivedAt">,
  today = new Date().toISOString().slice(0, 10),
): boolean {
  if (doc.kind !== "invoice" || doc.archivedAt) return false;
  if (doc.status !== "sent" && doc.status !== "overdue" && doc.status !== "draft") return false;
  return Boolean(doc.dueDate) && doc.dueDate < today;
}
