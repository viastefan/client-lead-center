import assert from "node:assert/strict";
import { test } from "node:test";
import { financeSummary } from "./finance";
import { coerceDocument } from "./coerce";

test("finance summary ignores draft invoices as open receivables", () => {
  const summary = financeSummary(
    [
      coerceDocument({
        id: "draft",
        kind: "invoice",
        status: "draft",
        dueDate: "2026-09-01",
        issueDate: "2026-08-01",
        taxRate: 19,
        items: [{ id: "1", title: "A", description: "", qty: 1, unit: "x", unitPrice: 100 }],
      }),
      coerceDocument({
        id: "sent",
        kind: "invoice",
        status: "sent",
        dueDate: "2026-10-01",
        issueDate: "2026-09-01",
        taxRate: 19,
        items: [{ id: "1", title: "A", description: "", qty: 1, unit: "x", unitPrice: 200 }],
      }),
      coerceDocument({
        id: "paid",
        kind: "invoice",
        status: "paid",
        paidAt: "2026-09-10",
        issueDate: "2026-09-01",
        dueDate: "2026-09-15",
        taxRate: 19,
        items: [{ id: "1", title: "A", description: "", qty: 1, unit: "x", unitPrice: 50 }],
      }),
    ],
    "2026-09-24",
  );
  assert.equal(summary.openInvoiceAmount, 238);
  assert.equal(summary.overdueCount, 0);
  assert.equal(summary.paidThisMonth, 59.5);
});
