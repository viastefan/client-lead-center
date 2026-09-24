import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogCustomers } from "./catalog";
import { mergeDirectory, searchDirectory } from "./directory";

test("directory always includes live websites", () => {
  const rows = mergeDirectory([]);
  assert.ok(rows.length >= 8);
  assert.ok(rows.some((row) => row.email === "info@abelen-immobilien.de"));
  assert.ok(rows.some((row) => row.websiteUrl.includes("vercel.app")));
});

test("local wix records overlay catalog by email and stay selectable", () => {
  const catalog = catalogCustomers();
  const abelen = catalog.find((row) => row.email.includes("abelen"))!;
  const merged = mergeDirectory([
    {
      ...abelen,
      address: "München",
      contactName: "Herr Abelen",
      source: "website",
    },
    {
      id: "wix-1",
      companyName: "Studio Nord",
      contactName: "Lea Nord",
      email: "hallo@studionord.de",
      phone: "",
      address: "",
      domain: "studionord.wixsite.com/home",
      websiteUrl: "https://studionord.wixsite.com/home",
      source: "wix",
      notes: "",
      status: "active",
    },
  ]);
  const found = merged.find((row) => row.email === abelen.email);
  assert.equal(found?.address, "München");
  assert.equal(found?.contactName, "Herr Abelen");
  const hits = searchDirectory(merged, "wixsite");
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.source, "wix");
});
