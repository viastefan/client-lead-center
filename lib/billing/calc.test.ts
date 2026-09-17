import assert from "node:assert/strict";
import { test } from "node:test";
import { documentTotals, formatDocumentNumber, isOverdueInvoice, lineNet, round2 } from "./calc";

test("line and document totals use German tax math", () => {
  assert.equal(lineNet({ qty: 2, unitPrice: 19.9 }), 39.8);
  const totals = documentTotals({
    taxRate: 19,
    items: [
      { id: "1", title: "A", description: "", qty: 1, unit: "x", unitPrice: 100 },
      { id: "2", title: "B", description: "", qty: 2, unit: "x", unitPrice: 50 },
    ],
  });
  assert.equal(totals.net, 200);
  assert.equal(totals.tax, 38);
  assert.equal(totals.gross, 238);
  assert.equal(round2(19.995), 20);
});

test("document numbers stay sequential and padded", () => {
  assert.equal(formatDocumentNumber("ang", 2026, 7), "ANG-2026-0007");
  assert.equal(formatDocumentNumber("RE!", 2026, 1), "RE-2026-0001");
});

test("invoices become overdue after the due date", () => {
  assert.equal(
    isOverdueInvoice({ kind: "invoice", status: "sent", dueDate: "2026-09-01", archivedAt: null }, "2026-09-17"),
    true,
  );
  assert.equal(
    isOverdueInvoice({ kind: "quote", status: "sent", dueDate: "2026-09-01", archivedAt: null }, "2026-09-17"),
    false,
  );
});
