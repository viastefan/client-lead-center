import assert from "node:assert/strict";
import { test } from "node:test";
import { renderMailPlaceholders, templateById } from "./templates";
import { collectBroadcastRecipients } from "./recipients";
import { escapeHtml, htmlFromText } from "./html";

test("placeholders fill company contact email and domain", () => {
  const rendered = renderMailPlaceholders("Hallo {contact} von {company} ({email}) auf {domain}", {
    company: "Abelen Immobilien",
    contact: "Abelen",
    email: "info@abelen-immobilien.de",
    domain: "www.abelen-immobilien.de",
  });
  assert.match(rendered, /Abelen Immobilien/);
  assert.match(rendered, /info@abelen-immobilien.de/);
  assert.equal(templateById("missing").id, "status");
});

test("broadcast recipients skip inactive and duplicate emails", () => {
  const rows = collectBroadcastRecipients(
    [
      {
        id: "a",
        company_name: "A",
        contact_name: "Ada",
        contact_email: "ada@a.de",
        status: "active",
      },
      {
        id: "b",
        company_name: "B",
        contact_name: "Bea",
        contact_email: "ADA@a.de",
        status: "active",
      },
      {
        id: "c",
        company_name: "C",
        contact_name: "Cara",
        contact_email: "cara@c.de",
        status: "inactive",
      },
      {
        id: "d",
        company_name: "D",
        contact_name: "Dan",
        contact_email: "not-an-email",
        status: "active",
      },
    ],
    [{ customer_id: "a", domain: "a.de" }],
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.email, "ada@a.de");
  assert.equal(rows[0]?.domain, "a.de");
});

test("html mail escapes tags", () => {
  assert.equal(escapeHtml("<x>"), "&lt;x&gt;");
  assert.match(htmlFromText("A\n\nB<script>"), /&lt;script&gt;/);
});
