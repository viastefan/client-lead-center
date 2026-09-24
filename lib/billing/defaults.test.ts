import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_COMPANY, emptyBillingState, STORAGE_KEY } from "./defaults";

test("billing starts empty under Stefan Dirnberger, not Festag", () => {
  const state = emptyBillingState();
  assert.equal(STORAGE_KEY, "clc.billing.v2");
  assert.equal(state.documents.length, 0);
  assert.equal(state.reminders.length, 0);
  assert.equal(DEFAULT_COMPANY.legalName, "Stefan Dirnberger");
  assert.equal(DEFAULT_COMPANY.city, "Kumhausen");
  assert.equal(DEFAULT_COMPANY.street, "Lindenstr. 15");
  assert.equal(DEFAULT_COMPANY.taxNumber, "69343720183");
  assert.doesNotMatch(DEFAULT_COMPANY.legalName, /Festag/i);
  assert.doesNotMatch(DEFAULT_COMPANY.tradeName, /Festag|Client Lead Center/i);
});
