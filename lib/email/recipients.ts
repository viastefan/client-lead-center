export type BroadcastRecipient = {
  id: string;
  company: string;
  contact: string;
  email: string;
  domain: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isBroadcastEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

export function collectBroadcastRecipients(
  customers: Array<{
    id: string;
    company_name: string;
    contact_name: string;
    contact_email: string;
    status?: string;
  }>,
  websites: Array<{ customer_id: string; domain?: string | null }> = [],
): BroadcastRecipient[] {
  const domains = new Map<string, string>();
  for (const site of websites) {
    if (!domains.has(site.customer_id) && site.domain) {
      domains.set(site.customer_id, site.domain);
    }
  }

  const seen = new Set<string>();
  const rows: BroadcastRecipient[] = [];
  for (const customer of customers) {
    if (customer.status && customer.status !== "active") continue;
    const email = customer.contact_email.trim().toLowerCase();
    if (!isBroadcastEmail(email) || seen.has(email)) continue;
    seen.add(email);
    rows.push({
      id: customer.id,
      company: customer.company_name,
      contact: customer.contact_name || customer.company_name,
      email,
      domain: domains.get(customer.id) ?? "",
    });
  }
  return rows;
}
