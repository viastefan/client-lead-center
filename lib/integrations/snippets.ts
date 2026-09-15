import { findCatalogSite } from "@/lib/catalog/vercel-sites";
import { getAppUrl } from "@/lib/env";
import type { Website } from "@/types";

export function leadApiUrl(): string {
  const appUrl =
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : getAppUrl());
  const normalized = appUrl.replace(/\/$/, "");
  if (normalized.includes("localhost") && process.env.NODE_ENV === "production") {
    return "https://client-lead-center.vercel.app/api/leads";
  }
  return `${normalized}/api/leads`;
}

export function allowedHostsForWebsite(website: Pick<Website, "domain" | "vercel_project" | "vercel_url" | "github_repo" | "allowed_hosts">): string[] {
  const catalog = findCatalogSite({
    vercelProject: website.vercel_project,
    domain: website.domain,
    githubRepo: website.github_repo,
  });
  const fromVercelUrl = website.vercel_url
    ? [new URL(website.vercel_url).hostname]
    : [];
  return Array.from(
    new Set([
      website.domain.replace(/^https?:\/\//, ""),
      ...fromVercelUrl,
      ...(website.allowed_hosts ?? []),
      ...(catalog?.allowedHosts ?? []),
    ]),
  ).map((host) => host.toLowerCase());
}

export function isHostAllowed(host: string, allowed: string[]): boolean {
  const normalized = host.toLowerCase();
  if (
    process.env.NODE_ENV !== "production" &&
    (normalized === "localhost" || normalized === "127.0.0.1")
  ) {
    return true;
  }
  return allowed.some((entry) => {
    if (normalized === entry || normalized.endsWith(`.${entry}`)) {
      return true;
    }
    if (!entry.endsWith(".vercel.app")) {
      return false;
    }
    const project = entry.replace(/\.vercel\.app$/, "");
    return normalized.startsWith(`${project}-`) && normalized.endsWith(".vercel.app");
  });
}

export function envSnippet(website: Pick<Website, "id" | "customer_id">, apiKey?: string): string {
  return [
    `LEAD_API_URL=${leadApiUrl()}`,
    `CUSTOMER_ID=${website.customer_id}`,
    `WEBSITE_ID=${website.id}`,
    `LEAD_API_KEY=${apiKey ?? "<API-Key nach Generieren einsetzen>"}`,
  ].join("\n");
}

export function contactRouteSnippet(): string {
  return `import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const response = await fetch(process.env.LEAD_API_URL!, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.LEAD_API_KEY!,
    },
    body: JSON.stringify({
      customerId: process.env.CUSTOMER_ID,
      websiteId: process.env.WEBSITE_ID,
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      message: body.message,
      source: "website",
      pageUrl: body.pageUrl,
      metadata: {},
    }),
  });

  if (!response.ok) {
    return Response.json({ success: false }, { status: 502 });
  }

  const payload = (await response.json()) as { leadId?: string };
  return Response.json({ success: true, leadId: payload.leadId }, { status: 201 });
}
`;
}

export function submitLeadSnippet(): string {
  return `export async function submitLead(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Anfrage konnte nicht gesendet werden.");
  }

  return response.json();
}
`;
}

export function curlSnippet(
  website: Pick<Website, "id" | "customer_id">,
  apiKey?: string,
): string {
  return [
    `curl -X POST "${leadApiUrl()}" \\`,
    `  -H "content-type: application/json" \\`,
    `  -H "x-api-key: ${apiKey ?? "$LEAD_API_KEY"}" \\`,
    `  -d '{`,
    `    "customerId": "${website.customer_id}",`,
    `    "websiteId": "${website.id}",`,
    `    "name": "Test",`,
    `    "email": "test@example.com",`,
    `    "message": "Testanfrage"`,
    `  }'`,
  ].join("\n");
}

export { VERCEL_CUSTOMER_SITES } from "@/lib/catalog/vercel-sites";
