import assert from "node:assert/strict";
import { test } from "node:test";
import { documentCorrespondence } from "./correspondence";
import { DEFAULT_COMPANY } from "./defaults";
import type { BusinessDocument } from "./types";

const invoice: BusinessDocument = {
  id: "doc-1",
  kind: "invoice",
  number: "RE-2026-0001",
  status: "sent",
  templateId: "atelier",
  customerId: "c1",
  customerName: "Abelen Immobilien",
  customerContact: "Abelen",
  customerEmail: "info@abelen-immobilien.de",
  customerAddress: "München",
  issueDate: "2026-09-24",
  dueDate: "2026-10-08",
  intro: "",
  notes: "",
  taxRate: 19,
  currency: "EUR",
  items: [{ id: "i1", title: "Betreuung", description: "", qty: 1, unit: "Monat", unitPrice: 100 }],
  paymentToken: "paytoken01",
  createdAt: "2026-09-24T09:00:00.000Z",
  updatedAt: "2026-09-24T09:00:00.000Z",
  archivedAt: null,
  convertedFromId: null,
};

test("invoice mail is signed by Stefan Dirnberger and can remind", () => {
  const sent = documentCorrespondence(invoice, DEFAULT_COMPANY, "https://client-lead-center.vercel.app");
  assert.match(sent.subject, /RE-2026-0001/);
  assert.match(sent.body, /Stefan Dirnberger/);
  assert.match(sent.body, /Kumhausen/);
  const reminder = documentCorrespondence(invoice, DEFAULT_COMPANY, "https://client-lead-center.vercel.app", "reminder");
  assert.match(reminder.subject, /Zahlungserinnerung/);
  assert.match(reminder.body, /Zahlungslink/);
});
