import assert from "node:assert/strict";
import { test } from "node:test";
import type { BusinessDocument, Reminder } from "@/lib/billing/types";
import { coerceDocument } from "@/lib/billing/coerce";
import { derivedReminders, mergeReminders } from "./reminders";

function doc(partial: Partial<BusinessDocument> & Pick<BusinessDocument, "id" | "kind" | "status" | "dueDate">): BusinessDocument {
  return coerceDocument({
    customerName: "Kunde",
    issueDate: "2026-09-01",
    paymentToken: "t",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...partial,
  });
}

test("derived reminders cover overdue invoices, quotes and contracts", () => {
  const rows = derivedReminders(
    [
      doc({ id: "inv", kind: "invoice", status: "sent", dueDate: "2026-09-01", number: "RE-1" }),
      doc({ id: "q", kind: "quote", status: "sent", dueDate: "2026-09-18", number: "ANG-1" }),
      doc({ id: "c", kind: "contract", status: "active", dueDate: "2026-10-01", number: "VER-1" }),
    ],
    "2026-09-17",
  );
  assert.equal(rows.some((item) => item.source === "invoice" && item.relatedId === "inv"), true);
  assert.equal(rows.some((item) => item.source === "quote" && item.relatedId === "q"), true);
  assert.equal(rows.some((item) => item.source === "contract" && item.relatedId === "c"), true);
});

test("done manual reminders hide matching derived ones", () => {
  const derived = derivedReminders(
    [doc({ id: "inv", kind: "invoice", status: "sent", dueDate: "2026-09-01", number: "RE-1" })],
    "2026-09-17",
  );
  const done: Reminder = {
    id: "manual",
    title: "ok",
    note: "",
    dueDate: "2026-09-17",
    status: "done",
    source: "invoice",
    relatedId: "inv",
    customerName: "Kunde",
    createdAt: "2026-09-17T00:00:00.000Z",
  };
  const merged = mergeReminders([done], derived);
  assert.equal(merged.some((item) => item.id.startsWith("derived-")), false);
  assert.equal(merged.some((item) => item.id === "manual"), true);
});
