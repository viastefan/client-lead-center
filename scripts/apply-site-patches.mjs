#!/usr/bin/env node
/**
 * Copies integrations/sites/<repo>/… into sibling Git checkouts.
 *
 * Usage:
 *   node scripts/apply-site-patches.mjs
 *   node scripts/apply-site-patches.mjs /path/to/repos
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const patchesRoot = path.join(root, "integrations", "sites");
const destRoot = path.resolve(process.argv[2] ?? path.join(root, ".."));

const ENV_BLOCK = [
  "",
  "# Client Lead Center (server-only, never NEXT_PUBLIC_)",
  "LEAD_API_URL=https://client-lead-center.vercel.app/api/leads",
  "CUSTOMER_ID=",
  "WEBSITE_ID=",
  "LEAD_API_KEY=",
  "",
].join("\n");

function copyDir(from, to) {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.name === "README.md") continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      copyDir(src, dest);
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }
}

function ensureEnvExample(repoDir) {
  const envPath = path.join(repoDir, ".env.example");
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `# Environment\n${ENV_BLOCK}`);
    return;
  }
  const current = fs.readFileSync(envPath, "utf8");
  if (!current.includes("LEAD_API_KEY=")) {
    fs.appendFileSync(envPath, ENV_BLOCK);
  }
}

if (!fs.existsSync(patchesRoot)) {
  console.error("Missing", patchesRoot);
  process.exit(1);
}

let patched = 0;
let skipped = 0;

for (const site of fs.readdirSync(patchesRoot, { withFileTypes: true })) {
  if (!site.isDirectory()) continue;
  const from = path.join(patchesRoot, site.name);
  const to = path.join(destRoot, site.name);
  if (!fs.existsSync(to)) {
    console.warn("skip missing checkout:", to);
    skipped += 1;
    continue;
  }
  copyDir(from, to);
  ensureEnvExample(to);
  console.log("patched", site.name, "→", to);
  patched += 1;
}

console.log(`done: ${patched} patched, ${skipped} skipped`);
if (patched === 0) process.exit(2);
