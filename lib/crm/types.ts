export const DIRECTORY_SOURCES = ["website", "wix", "manual"] as const;
export type DirectorySource = (typeof DIRECTORY_SOURCES)[number];

export type DirectoryCustomer = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  domain: string;
  websiteUrl: string;
  source: DirectorySource;
  notes: string;
  status: "active" | "inactive";
};

export function sourceLabel(source: DirectorySource): string {
  if (source === "wix") return "Wix";
  if (source === "website") return "Website";
  return "Manuell";
}

export function directorySearchHaystack(customer: DirectoryCustomer): string {
  return `${customer.companyName} ${customer.contactName} ${customer.email} ${customer.domain} ${customer.address} ${customer.websiteUrl}`.toLowerCase();
}

export function coerceDirectoryCustomer(raw: Partial<DirectoryCustomer> & { id: string; companyName: string }): DirectoryCustomer {
  return {
    id: raw.id,
    companyName: raw.companyName,
    contactName: raw.contactName ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    address: raw.address ?? "",
    domain: (raw.domain ?? "").replace(/^https?:\/\//, ""),
    websiteUrl: raw.websiteUrl ?? "",
    source: raw.source === "wix" || raw.source === "website" || raw.source === "manual" ? raw.source : "manual",
    notes: raw.notes ?? "",
    status: raw.status === "inactive" ? "inactive" : "active",
  };
}
