import assert from "node:assert/strict";
import { test } from "node:test";
import { VERCEL_CUSTOMER_SITES } from "../catalog/vercel-sites";
import {
  demoCustomerRows,
  demoDashboardStats,
  demoLeads,
  demoWebsiteRows,
  filterDemoLeads,
} from "./workspace";

test("preview workspace covers the live catalog", () => {
  assert.equal(demoCustomerRows().length, VERCEL_CUSTOMER_SITES.length);
  assert.equal(demoWebsiteRows().length, VERCEL_CUSTOMER_SITES.length);
  assert.equal(demoDashboardStats().websiteCount, 8);
  assert.ok(demoLeads().length >= 6);
});

test("preview lead filters match status and query", () => {
  const neu = filterDemoLeads({ status: "new" });
  assert.ok(neu.every((lead) => lead.status === "new"));
  const search = filterDemoLeads({ query: "Schwabing" });
  assert.equal(search.length, 1);
  assert.equal(search[0]?.name, "Anna Keller");
});
