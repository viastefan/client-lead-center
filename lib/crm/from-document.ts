import { findDirectoryCustomer } from "./directory";
import { directoryFromLocal, upsertLocalCustomer } from "./store";
import type { DirectoryCustomer } from "./types";

export function persistRecipientFromDocument(input: {
  customerId?: string;
  customerName: string;
  customerContact: string;
  customerEmail: string;
  customerAddress: string;
  customerVatId?: string;
  customerPhone?: string;
}): DirectoryCustomer | null {
  if (!input.customerEmail && !input.customerName) return null;
  const existing = input.customerId ? findDirectoryCustomer(directoryFromLocal(), input.customerId) : undefined;
  return upsertLocalCustomer({
    id: existing?.id ?? input.customerId,
    companyName: input.customerName || existing?.companyName || input.customerEmail,
    contactName: input.customerContact || existing?.contactName || "",
    email: input.customerEmail || existing?.email || "",
    phone: input.customerPhone || existing?.phone || "",
    address: input.customerAddress || existing?.address || "",
    vatId: input.customerVatId || existing?.vatId || "",
    domain: existing?.domain ?? "",
    websiteUrl: existing?.websiteUrl ?? "",
    source: existing?.source ?? "manual",
    notes: existing?.notes ?? "",
    status: existing?.status ?? "active",
  });
}
