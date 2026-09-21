import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyHttpStatus, probeUrlForSite } from "./monitor";
import { VERCEL_CUSTOMER_SITES } from "@/lib/catalog/vercel-sites";

test("http status classification for site monitoring", () => {
  assert.equal(classifyHttpStatus(200, false), "up");
  assert.equal(classifyHttpStatus(301, false), "up");
  assert.equal(classifyHttpStatus(403, false), "protected");
  assert.equal(classifyHttpStatus(500, false), "down");
  assert.equal(classifyHttpStatus(null, true), "timeout");
  assert.equal(classifyHttpStatus(null, false), "down");
});

test("catalog sites have probe urls", () => {
  assert.equal(VERCEL_CUSTOMER_SITES.length, 8);
  for (const site of VERCEL_CUSTOMER_SITES) {
    assert.match(probeUrlForSite(site), /^https:\/\//);
  }
});
