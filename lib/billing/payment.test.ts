import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_COMPANY } from "./defaults";
import { coerceDocument } from "./coerce";
import {
  decodePaymentSnapshot,
  encodePaymentSnapshot,
  paymentPath,
  paypalHref,
  paymentSnapshotFor,
  snapshotFromBillingJson,
} from "./payment";

const doc = coerceDocument({
  id: "doc-1",
  kind: "invoice",
  number: "RE-2026-0001",
  status: "sent",
  templateId: "linear",
  customerId: "c1",
  customerName: "AVS",
  customerContact: "Ops",
  customerEmail: "ops@example.com",
  customerAddress: "München",
  issueDate: "2026-09-17",
  dueDate: "2026-10-01",
  taxRate: 19,
  items: [{ id: "i1", title: "Betreuung", description: "", qty: 1, unit: "Monat", unitPrice: 100 }],
  paymentToken: "paytoken01",
  createdAt: "2026-09-17T09:00:00.000Z",
  updatedAt: "2026-09-17T09:00:00.000Z",
});

test("payment snapshots round-trip through the public link", () => {
  const snapshot = paymentSnapshotFor(doc, {
    ...DEFAULT_COMPANY,
    iban: "DE00",
    paypalUrl: "https://paypal.me/festag",
  });
  assert.equal(snapshot.amount, 119);
  const encoded = encodePaymentSnapshot(snapshot);
  const decoded = decodePaymentSnapshot(encoded);
  assert.deepEqual(decoded, snapshot);
  assert.match(paymentPath(snapshot), /^\/pay\/paytoken01\?s=/);
});

test("paypal href carries amount and invoice number", () => {
  const href = paypalHref("https://paypal.me/festag", 119, "RE-2026-0001");
  const url = new URL(href);
  assert.equal(url.searchParams.get("amount"), "119.00");
  assert.equal(url.searchParams.get("currency_code"), "EUR");
  assert.equal(url.searchParams.get("item_name"), "RE-2026-0001");
});

test("billing json fallback finds invoices by token", () => {
  const raw = JSON.stringify({
    version: 2,
    company: { ...DEFAULT_COMPANY, iban: "DE00" },
    documents: [doc],
    reminders: [],
    sequences: { quote: 1, invoice: 1, contract: 1 },
  });
  const snapshot = snapshotFromBillingJson(raw, "paytoken01");
  assert.equal(snapshot?.number, "RE-2026-0001");
  assert.equal(snapshotFromBillingJson(raw, "missing"), null);
  assert.equal(decodePaymentSnapshot("not-base64"), null);
});
