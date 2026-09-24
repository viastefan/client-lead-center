import { documentTotals, isOpenReceivable, isOverdueInvoice } from "./calc";
import type { BusinessDocument } from "./types";

export function documentsForCustomer(documents: BusinessDocument[], customerId: string): BusinessDocument[] {
  return documents.filter((doc) => !doc.archivedAt && doc.customerId === customerId);
}

export function customerLedger(documents: BusinessDocument[], customerId: string) {
  const rows = documentsForCustomer(documents, customerId);
  const invoices = rows.filter((doc) => doc.kind === "invoice");
  const open = invoices.filter((doc) => isOpenReceivable(doc));
  const overdue = invoices.filter((doc) => isOverdueInvoice(doc));
  const paid = invoices.filter((doc) => doc.status === "paid");
  return {
    rows,
    quotes: rows.filter((doc) => doc.kind === "quote").length,
    invoices: invoices.length,
    contracts: rows.filter((doc) => doc.kind === "contract").length,
    openAmount: open.reduce((sum, doc) => sum + documentTotals(doc).gross, 0),
    overdueAmount: overdue.reduce((sum, doc) => sum + documentTotals(doc).gross, 0),
    paidAmount: paid.reduce((sum, doc) => sum + documentTotals(doc).gross, 0),
  };
}
