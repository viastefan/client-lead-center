import assert from "node:assert/strict";
import { test } from "node:test";
import { buildWorkspaceBackup, mergeWorkspaceBackup, parseWorkspaceBackup } from "./backup";
import { emptyBillingState } from "./defaults";
import { coerceDocument } from "./coerce";

test("workspace backup round-trips documents and merges by id", () => {
  const current = emptyBillingState();
  const backup = buildWorkspaceBackup(
    {
      ...current,
      documents: [
        coerceDocument({
          id: "doc-1",
          kind: "invoice",
          number: "RE-2026-0001",
          status: "sent",
          customerName: "Abelen",
        }),
      ],
      sequences: { quote: 2, invoice: 4, contract: 1 },
    },
    [
      {
        id: "wix-1",
        companyName: "Studio Nord",
        contactName: "Lea",
        email: "hallo@studionord.de",
        phone: "",
        address: "",
        vatId: "",
        domain: "studionord.wixsite.com",
        websiteUrl: "https://studionord.wixsite.com/home",
        source: "wix",
        notes: "",
        status: "active",
      },
    ],
  );
  const raw = JSON.stringify(backup);
  const parsed = parseWorkspaceBackup(raw);
  assert.equal(parsed?.billing.documents[0]?.number, "RE-2026-0001");
  assert.equal(parsed?.crm[0]?.source, "wix");
  const merged = mergeWorkspaceBackup(current, [], parsed!);
  assert.equal(merged.billing.documents.length, 1);
  assert.equal(merged.billing.sequences.invoice, 4);
  assert.equal(merged.crm[0]?.companyName, "Studio Nord");
  assert.equal(parseWorkspaceBackup("{"), null);
});
