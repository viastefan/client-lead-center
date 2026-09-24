import { VERCEL_CUSTOMER_SITES } from "@/lib/catalog/vercel-sites";
import type { DirectoryCustomer } from "./types";

export function catalogCustomerId(slug: string): string {
  return `demo-customer-${slug}`;
}

export function catalogCustomers(): DirectoryCustomer[] {
  return VERCEL_CUSTOMER_SITES.map((site) => ({
    id: catalogCustomerId(site.slug),
    companyName: site.companyName,
    contactName: site.contactName,
    email: site.contactEmail,
    phone: "",
    address: "",
    domain: site.domain,
    websiteUrl: site.vercelUrl,
    source: "website",
    notes: `Live-Website · ${site.domain}`,
    status: "active",
  }));
}
