import { coerceDirectoryCustomer, type DirectoryCustomer, type DirectorySource } from "./types";
import { mergeDirectory } from "./directory";

export const CRM_KEY = "clc.crm.v1";
export const EMPTY_LOCAL: DirectoryCustomer[] = [];

type CrmState = { version: 1; customers: DirectoryCustomer[] };

function parse(raw: string | null): DirectoryCustomer[] {
  if (!raw) return EMPTY_LOCAL;
  try {
    const parsed = JSON.parse(raw) as CrmState;
    if (parsed.version !== 1 || !Array.isArray(parsed.customers)) return EMPTY_LOCAL;
    return parsed.customers
      .filter((row) => row && typeof row.id === "string" && typeof row.companyName === "string")
      .map((row) => coerceDirectoryCustomer(row));
  } catch {
    return EMPTY_LOCAL;
  }
}

let crmRaw: string | null | undefined;
let crmSnap: DirectoryCustomer[] = EMPTY_LOCAL;

export function readLocalCustomers(): DirectoryCustomer[] {
  if (typeof window === "undefined") return EMPTY_LOCAL;
  const raw = window.localStorage.getItem(CRM_KEY);
  if (raw === crmRaw) return crmSnap;
  crmRaw = raw;
  crmSnap = parse(raw);
  return crmSnap;
}

export function subscribeLocalCustomers(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("clc-crm", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("clc-crm", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function writeLocal(customers: DirectoryCustomer[]) {
  const raw = JSON.stringify({ version: 1, customers } satisfies CrmState);
  window.localStorage.setItem(CRM_KEY, raw);
  crmRaw = raw;
  crmSnap = customers;
  window.dispatchEvent(new Event("clc-crm"));
}

export function replaceLocalCustomers(customers: DirectoryCustomer[]) {
  writeLocal(customers.map((row) => coerceDirectoryCustomer(row)));
}

export function upsertLocalCustomer(
  input: Omit<DirectoryCustomer, "id" | "status"> & { id?: string; status?: DirectoryCustomer["status"] },
): DirectoryCustomer {
  const current = readLocalCustomers();
  const id = input.id ?? crypto.randomUUID();
  const next = coerceDirectoryCustomer({
    id,
    companyName: input.companyName.trim(),
    contactName: input.contactName.trim() || input.companyName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    vatId: (input.vatId ?? "").trim(),
    domain: input.domain.trim(),
    websiteUrl: input.websiteUrl.trim(),
    source: input.source,
    notes: input.notes.trim(),
    status: input.status ?? "active",
  });
  const exists = current.some((item) => item.id === id);
  writeLocal(exists ? current.map((item) => (item.id === id ? next : item)) : [next, ...current]);
  return next;
}

export function removeLocalCustomer(id: string) {
  writeLocal(readLocalCustomers().filter((item) => item.id !== id));
}

export function directoryFromLocal(): DirectoryCustomer[] {
  return mergeDirectory(readLocalCustomers());
}

export function sourceFromForm(value: string | null | undefined): DirectorySource {
  if (value === "wix" || value === "website" || value === "manual") return value;
  return "manual";
}
