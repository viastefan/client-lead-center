import assert from "node:assert/strict";
import { test } from "node:test";
import type { BusinessDocument } from "@/lib/billing/types";
import { buildInbox, inboxKindLabel } from "./inbox";

function doc(partial: Partial<BusinessDocument> & Pick<BusinessDocument, "id" | "kind" | "status" | "dueDate">): BusinessDocument {
  return {
    number: "X",
    templateId: "linear",
    customerId: "",
    customerName: "Kunde",
    customerContact: "",
    customerEmail: "",
    customerAddress: "",
    issueDate: "2026-09-01",
    intro: "",
    notes: "",
    taxRate: 19,
    currency: "EUR",
    items: [],
    paymentToken: "t",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    archivedAt: null,
    convertedFromId: null,
    ...partial,
  };
}

test("inbox ranks overdue invoices ahead of new leads", () => {
  const rows = buildInbox(
    {
      documents: [doc({ id: "inv", kind: "invoice", status: "sent", dueDate: "2026-09-01", number: "RE-1" })],
      reminders: [],
      leads: [
        {
          id: "l1",
          name: "Anna",
          email: "a@x.de",
          status: "new",
          customerName: "Abelen",
          createdAt: "2026-09-17T08:00:00.000Z",
          customerId: "c1",
        },
      ],
    },
    "2026-09-17",
  );
  assert.equal(rows[0]?.kind, "invoice");
  assert.equal(rows.some((item) => item.kind === "lead" && item.title === "Anna"), true);
});

test("inbox kind labels are German", () => {
  assert.equal(inboxKindLabel("invoice"), "Rechnung");
  assert.equal(inboxKindLabel("lead"), "Lead");
  assert.equal(inboxKindLabel("reminder"), "Erinnerung");
});
