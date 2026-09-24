import type { DirectoryCustomer } from "./types";
import { catalogCustomers } from "./catalog";
import { directorySearchHaystack } from "./types";

function identityKeys(customer: DirectoryCustomer): string[] {
  const keys = [`id:${customer.id}`];
  const email = customer.email.trim().toLowerCase();
  if (email) keys.push(`email:${email}`);
  const domain = customer.domain.trim().toLowerCase().replace(/^www\./, "");
  if (domain) keys.push(`domain:${domain}`);
  return keys;
}

function mergeRecord(base: DirectoryCustomer, overlay: DirectoryCustomer): DirectoryCustomer {
  return {
    ...base,
    ...overlay,
    id: base.id,
    address: overlay.address || base.address,
    phone: overlay.phone || base.phone,
    notes: overlay.notes || base.notes,
    websiteUrl: overlay.websiteUrl || base.websiteUrl,
    contactName: overlay.contactName || base.contactName,
    domain: overlay.domain || base.domain,
  };
}

export function mergeDirectory(local: DirectoryCustomer[], server: DirectoryCustomer[] = []): DirectoryCustomer[] {
  const byId = new Map<string, DirectoryCustomer>();
  const index = new Map<string, string>();

  function remember(customer: DirectoryCustomer) {
    byId.set(customer.id, customer);
    for (const key of identityKeys(customer)) index.set(key, customer.id);
  }

  function put(customer: DirectoryCustomer, overlay: boolean) {
    const hit = identityKeys(customer)
      .map((key) => index.get(key))
      .find(Boolean);
    if (!hit) {
      remember(customer);
      return;
    }
    const existing = byId.get(hit);
    if (!existing) {
      remember(customer);
      return;
    }
    remember(overlay ? mergeRecord(existing, customer) : existing);
  }

  for (const customer of catalogCustomers()) put(customer, false);
  for (const customer of server) put(customer, true);
  for (const customer of local) put(customer, true);

  return [...byId.values()].sort((a, b) => a.companyName.localeCompare(b.companyName, "de"));
}

export function searchDirectory(customers: DirectoryCustomer[], query: string): DirectoryCustomer[] {
  const q = query.trim().toLowerCase();
  if (!q) return customers.filter((item) => item.status === "active");
  return customers.filter((item) => directorySearchHaystack(item).includes(q));
}

export function findDirectoryCustomer(customers: DirectoryCustomer[], id: string): DirectoryCustomer | undefined {
  return customers.find((item) => item.id === id);
}
