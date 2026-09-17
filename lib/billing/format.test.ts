import assert from "node:assert/strict";
import { test } from "node:test";
import { interpolateTemplate } from "./format";

test("email subjects keep placeholders", () => {
  assert.equal(
    interpolateTemplate("Rechnung {number} – {company}", { number: "RE-1", company: "AVS" }),
    "Rechnung RE-1 – AVS",
  );
});
