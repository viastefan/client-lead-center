import { isOverdueInvoice } from "@/lib/billing/calc";
import type { BusinessDocument, Reminder } from "@/lib/billing/types";

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function derivedReminders(
  documents: BusinessDocument[],
  today = new Date().toISOString().slice(0, 10),
): Reminder[] {
  const soon = addDays(today, 3);
  const month = addDays(today, 30);
  const rows: Reminder[] = [];

  for (const doc of documents) {
    if (doc.archivedAt) continue;
    if (doc.kind === "invoice" && isOverdueInvoice(doc, today)) {
      rows.push({
        id: `derived-invoice-${doc.id}`,
        title: `Zahlungserinnerung ${doc.number}`,
        note: "Rechnung ist überfällig.",
        dueDate: doc.dueDate || today,
        status: "open",
        source: "invoice",
        relatedId: doc.id,
        customerName: doc.customerName,
        createdAt: doc.updatedAt,
      });
    }
    if (doc.kind === "quote" && (doc.status === "sent" || doc.status === "draft") && doc.dueDate && doc.dueDate <= soon) {
      rows.push({
        id: `derived-quote-${doc.id}`,
        title: `Angebot nachfassen ${doc.number}`,
        note: "Gültigkeit läuft ab oder ist abgelaufen.",
        dueDate: doc.dueDate,
        status: "open",
        source: "quote",
        relatedId: doc.id,
        customerName: doc.customerName,
        createdAt: doc.updatedAt,
      });
    }
    if (
      doc.kind === "contract" &&
      (doc.status === "active" || doc.status === "signed" || doc.status === "sent") &&
      doc.dueDate &&
      doc.dueDate <= month
    ) {
      rows.push({
        id: `derived-contract-${doc.id}`,
        title: `Vertrag verlängern ${doc.number}`,
        note: "Laufzeit endet in den nächsten 30 Tagen.",
        dueDate: doc.dueDate,
        status: "open",
        source: "contract",
        relatedId: doc.id,
        customerName: doc.customerName,
        createdAt: doc.updatedAt,
      });
    }
  }

  return rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function mergeReminders(manual: Reminder[], derived: Reminder[]): Reminder[] {
  const dismissed = new Set(
    manual.filter((item) => item.status === "done" && item.relatedId).map((item) => `${item.source}:${item.relatedId}`),
  );
  const extra = derived.filter((item) => !dismissed.has(`${item.source}:${item.relatedId}`));
  return [...manual, ...extra].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
