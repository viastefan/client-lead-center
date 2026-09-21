import { VERCEL_CUSTOMER_SITES, type VercelCustomerSite } from "@/lib/catalog/vercel-sites";

export type SiteProbeNote = "up" | "protected" | "down" | "timeout";

export type SiteProbe = {
  slug: string;
  companyName: string;
  domain: string;
  url: string;
  ok: boolean;
  status: number | null;
  ms: number;
  note: SiteProbeNote;
};

export function classifyHttpStatus(status: number | null, timedOut: boolean): SiteProbeNote {
  if (timedOut) return "timeout";
  if (status == null) return "down";
  if (status === 401 || status === 403) return "protected";
  if (status >= 200 && status < 400) return "up";
  return "down";
}

export function probeUrlForSite(site: VercelCustomerSite): string {
  if (site.domain.includes("vercel.app")) return site.vercelUrl;
  return `https://${site.domain}`;
}

async function request(url: string, method: "HEAD" | "GET", ms: number): Promise<{ status: number; ms: number }> {
  const started = Date.now();
  const response = await fetch(url, {
    method,
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(ms),
    headers: { accept: "text/html,application/json;q=0.9,*/*;q=0.8" },
  });
  return { status: response.status, ms: Date.now() - started };
}

export async function probeSite(site: VercelCustomerSite, timeoutMs = 4500): Promise<SiteProbe> {
  const url = probeUrlForSite(site);
  const started = Date.now();
  try {
    let result: { status: number; ms: number };
    try {
      result = await request(url, "HEAD", timeoutMs);
      if (result.status === 405 || result.status === 501) {
        result = await request(url, "GET", timeoutMs);
      }
    } catch {
      result = await request(url, "GET", timeoutMs);
    }
    const note = classifyHttpStatus(result.status, false);
    return {
      slug: site.slug,
      companyName: site.companyName,
      domain: site.domain,
      url,
      ok: note === "up" || note === "protected",
      status: result.status,
      ms: result.ms,
      note,
    };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || /timeout/i.test(error.message));
    return {
      slug: site.slug,
      companyName: site.companyName,
      domain: site.domain,
      url,
      ok: false,
      status: null,
      ms: Date.now() - started,
      note: classifyHttpStatus(null, timedOut),
    };
  }
}

export async function probeCatalogSites(): Promise<SiteProbe[]> {
  const results = await Promise.all(VERCEL_CUSTOMER_SITES.map((site) => probeSite(site)));
  return results;
}
