import assert from "node:assert/strict";
import { test } from "node:test";
import { applyDocumentLifecycle, coerceDocument } from "./coerce";

test("coerce fills VAT, service date and mail stamps for old archives", () => {
  const doc = coerceDocument({
    id: "legacy",
    kind: "invoice",
    number: "RE-2026-0001",
    status: "sent",
    customerName: "Studio",
    issueDate: "2026-09-01",
    dueDate: "2026-09-15",
    taxRate: 19,
    items: [{ id: "1", title: "A", description: "", qty: 1, unit: "x", unitPrice: 100 }],
  });
  assert.equal(doc.customerVatId, "");
  assert.equal(doc.serviceDate, "2026-09-01");
  assert.equal(doc.discountPercent, 0);
  assert.equal(doc.sentAt, null);
  assert.equal(doc.currency, "EUR");
});

test("lifecycle marks sent invoices overdue and sent quotes expired", () => {
  const invoice = applyDocumentLifecycle(
    coerceDocument({
      id: "inv",
      kind: "invoice",
      status: "sent",
      dueDate: "2026-09-01",
      issueDate: "2026-08-01",
    }),
    "2026-09-24",
  );
  assert.equal(invoice.status, "overdue");
  const quote = applyDocumentLifecycle(
    coerceDocument({
      id: "q",
      kind: "quote",
      status: "sent",
      dueDate: "2026-09-01",
      issueDate: "2026-08-01",
    }),
    "2026-09-24",
  );
  assert.equal(quote.status, "expired");
  const draft = applyDocumentLifecycle(
    coerceDocument({
      id: "d",
      kind: "invoice",
      status: "draft",
      dueDate: "2026-09-01",
      issueDate: "2026-08-01",
    }),
    "2026-09-24",
  );
  assert.equal(draft.status, "draft");
});
