import { documentTotals, isOpenReceivable, isOverdueInvoice } from "./calc";
import type { BusinessDocument } from "./types";

export function liveDocuments(documents: BusinessDocument[]): BusinessDocument[] {
  return documents.filter((doc) => !doc.archivedAt);
}

export function financeSummary(documents: BusinessDocument[], today = new Date().toISOString().slice(0, 10)) {
  const rows = liveDocuments(documents);
  const quotes = rows.filter((doc) => doc.kind === "quote");
  const invoices = rows.filter((doc) => doc.kind === "invoice");
  const contracts = rows.filter((doc) => doc.kind === "contract");
  const openQuotes = quotes.filter((doc) => doc.status === "sent" || doc.status === "draft" || doc.status === "accepted");
  const openInvoices = invoices.filter((doc) => isOpenReceivable(doc));
  const overdue = invoices.filter((doc) => isOverdueInvoice(doc, today));
  const paid = invoices.filter((doc) => doc.status === "paid");
  const month = today.slice(0, 7);
  const paidThisMonth = paid.filter((doc) => (doc.paidAt || doc.updatedAt).startsWith(month));

  return {
    quotes: quotes.length,
    invoices: invoices.length,
    contracts: contracts.length,
    openQuoteAmount: openQuotes.reduce((sum, doc) => sum + documentTotals(doc).gross, 0),
    openInvoiceAmount: openInvoices.reduce((sum, doc) => sum + documentTotals(doc).gross, 0),
    overdueAmount: overdue.reduce((sum, doc) => sum + documentTotals(doc).gross, 0),
    overdueCount: overdue.length,
    paidAmount: paid.reduce((sum, doc) => sum + documentTotals(doc).gross, 0),
    paidThisMonth: paidThisMonth.reduce((sum, doc) => sum + documentTotals(doc).gross, 0),
    sentQuotes: quotes.filter((doc) => doc.status === "sent").length,
    activeContracts: contracts.filter((doc) => doc.status === "active" || doc.status === "signed").length,
  };
}

export function listTotals(documents: BusinessDocument[]) {
  return documents.reduce((sum, doc) => sum + documentTotals(doc).gross, 0);
}
