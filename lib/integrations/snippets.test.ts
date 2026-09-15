import assert from "node:assert/strict";
import { test } from "node:test";
import { isHostAllowed } from "./snippets";

test("allows custom domain, apex and www", () => {
  const allowed = ["www.abelen-immobilien.de", "abelen-immobilien.de", "abelenimmobilienvermittlung.vercel.app"];
  assert.equal(isHostAllowed("www.abelen-immobilien.de", allowed), true);
  assert.equal(isHostAllowed("abelen-immobilien.de", allowed), true);
});

test("allows vercel preview hosts for the same project", () => {
  const allowed = ["abelenimmobilienvermittlung.vercel.app"];
  assert.equal(
    isHostAllowed("abelenimmobilienvermittlung-git-main.vercel.app", allowed),
    true,
  );
});

test("rejects unrelated hosts", () => {
  const allowed = ["abelenimmobilienvermittlung.vercel.app"];
  assert.equal(isHostAllowed("evil.com", allowed), false);
  assert.equal(isHostAllowed("other.vercel.app", allowed), false);
});
