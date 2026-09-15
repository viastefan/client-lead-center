import assert from "node:assert/strict";
import { test } from "node:test";
import { matchCatalogToWebsites, VERCEL_CUSTOMER_SITES } from "./vercel-sites";

test("catalog covers eight live customer sites", () => {
  assert.equal(VERCEL_CUSTOMER_SITES.length, 8);
  const slugs = new Set(VERCEL_CUSTOMER_SITES.map((site) => site.slug));
  for (const slug of [
    "abelenimmobilienvermittlung",
    "Wassana",
    "avs",
    "wascotextil",
    "festagwebsite",
    "eridebavaria",
    "figura",
    "muc-cargo-handling",
  ]) {
    assert.ok(slugs.has(slug), slug);
  }
});

test("matchCatalogToWebsites maps vercel_project slugs", () => {
  const matches = matchCatalogToWebsites([
    { id: "1", vercel_project: "avs", domain: "www.airport-verpackungen.de" },
  ]);
  const avs = matches.find((item) => item.site.slug === "avs");
  assert.equal(avs?.website?.id, "1");
  assert.equal(matches.filter((item) => item.website).length, 1);
});
