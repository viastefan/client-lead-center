/** Server-only. Forward a website inquiry to Client Lead Center.
 *  Skips silently when LEAD_API_KEY / CUSTOMER_ID / WEBSITE_ID are missing.
 *  Never import this from client components. */

const DEFAULT_LEAD_API_URL = "https://client-lead-center.vercel.app/api/leads";

export type LeadCenterPayload = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  source?: string;
  pageUrl?: string;
  metadata?: Record<string, unknown>;
};

export function isLeadCenterConfigured(): boolean {
  return Boolean(process.env.LEAD_API_KEY && process.env.CUSTOMER_ID && process.env.WEBSITE_ID);
}

export async function forwardLeadToCenter(
  input: LeadCenterPayload,
): Promise<{ skipped: true } | { ok: boolean; leadId?: string }> {
  if (!isLeadCenterConfigured()) {
    return { skipped: true };
  }

  const url = process.env.LEAD_API_URL || DEFAULT_LEAD_API_URL;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.LEAD_API_KEY!,
      },
      body: JSON.stringify({
        customerId: process.env.CUSTOMER_ID,
        websiteId: process.env.WEBSITE_ID,
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        message: input.message,
        source: input.source ?? "website",
        pageUrl: input.pageUrl,
        metadata: input.metadata ?? {},
      }),
    });

    if (!response.ok) {
      console.error("[lead-center] forward failed", response.status);
      return { ok: false };
    }

    const payload = (await response.json()) as { leadId?: string };
    return { ok: true, leadId: payload.leadId };
  } catch (error) {
    console.error("[lead-center] forward error", error);
    return { ok: false };
  }
}
