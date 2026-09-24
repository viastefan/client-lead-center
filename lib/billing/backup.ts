import { emptyBillingState } from "./defaults";
import { applyDocumentLifecycle, coerceDocument } from "./coerce";
import type { BillingState } from "./types";
import { coerceDirectoryCustomer, type DirectoryCustomer } from "@/lib/crm/types";

export type WorkspaceBackup = {
  v: 1;
  exportedAt: string;
  billing: BillingState;
  crm: DirectoryCustomer[];
};

export function buildWorkspaceBackup(billing: BillingState, crm: DirectoryCustomer[]): WorkspaceBackup {
  return {
    v: 1,
    exportedAt: new Date().toISOString(),
    billing,
    crm,
  };
}

export function parseWorkspaceBackup(raw: string): WorkspaceBackup | null {
  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceBackup> & { billing?: Partial<BillingState> };
    if (parsed.v !== 1 || !parsed.billing || !Array.isArray(parsed.crm)) return null;
    const fallback = emptyBillingState();
    const documents = Array.isArray(parsed.billing.documents)
      ? parsed.billing.documents.filter((doc) => doc && typeof doc.id === "string").map((doc) => applyDocumentLifecycle(coerceDocument(doc)))
      : [];
    return {
      v: 1,
      exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : new Date().toISOString(),
      billing: {
        version: 2,
        company: { ...fallback.company, ...parsed.billing.company },
        documents,
        reminders: Array.isArray(parsed.billing.reminders) ? parsed.billing.reminders : [],
        sequences: { ...fallback.sequences, ...parsed.billing.sequences },
      },
      crm: parsed.crm
        .filter((row) => row && typeof row.id === "string" && typeof row.companyName === "string")
        .map((row) => coerceDirectoryCustomer(row)),
    };
  } catch {
    return null;
  }
}

export function mergeWorkspaceBackup(
  current: BillingState,
  localCrm: DirectoryCustomer[],
  backup: WorkspaceBackup,
): { billing: BillingState; crm: DirectoryCustomer[] } {
  const byDoc = new Map(current.documents.map((doc) => [doc.id, doc]));
  for (const doc of backup.billing.documents) byDoc.set(doc.id, doc);
  const byCustomer = new Map(localCrm.map((row) => [row.id, row]));
  for (const row of backup.crm) byCustomer.set(row.id, row);
  const company = { ...current.company };
  for (const [key, value] of Object.entries(backup.billing.company) as Array<[keyof typeof company, string | number]>) {
    if (typeof value === "string" && value.trim() && !String(company[key] ?? "").trim()) {
      (company[key] as string | number) = value;
    }
  }
  return {
    billing: {
      version: 2,
      company,
      documents: [...byDoc.values()].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")),
      reminders: [
        ...backup.billing.reminders.filter((item) => !current.reminders.some((row) => row.id === item.id)),
        ...current.reminders,
      ],
      sequences: {
        quote: Math.max(current.sequences.quote, backup.billing.sequences.quote),
        invoice: Math.max(current.sequences.invoice, backup.billing.sequences.invoice),
        contract: Math.max(current.sequences.contract, backup.billing.sequences.contract),
      },
    },
    crm: [...byCustomer.values()],
  };
}
