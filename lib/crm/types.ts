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
  return `${customer.companyName} ${customer.contactName} ${customer.email} ${customer.domain} ${customer.address}`.toLowerCase();
}
