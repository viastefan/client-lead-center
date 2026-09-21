import { kindHref } from "@/lib/billing/labels";
import type { BusinessDocument, Reminder } from "@/lib/billing/types";
import { derivedReminders, mergeReminders } from "@/lib/ops/reminders";

export type InboxLead = {
  id: string;
  name: string;
  email: string;
  status: string;
  customerName: string;
  createdAt: string;
  customerId: string;
};

export type InboxItem = {
  id: string;
  kind: "lead" | "invoice" | "quote" | "contract" | "reminder";
  title: string;
  subtitle: string;
  href: string;
  tone: "danger" | "warning" | "neutral";
  dueDate: string;
};

function reminderHref(item: Reminder): string {
  if (item.relatedId && (item.source === "quote" || item.source === "invoice" || item.source === "contract")) {
    return `${kindHref(item.source)}/${item.relatedId}`;
  }
  if (item.source === "lead" && item.relatedId) return `/leads/${item.relatedId}`;
  return "/reminders";
}

export function buildInbox(
  input: {
    documents: BusinessDocument[];
    reminders: Reminder[];
    leads?: InboxLead[];
  },
  today = new Date().toISOString().slice(0, 10),
): InboxItem[] {
  const openReminders = mergeReminders(input.reminders, derivedReminders(input.documents, today)).filter(
    (item) => item.status === "open",
  );

  const reminderItems: InboxItem[] = openReminders.map((item) => ({
    id: item.id,
    kind: item.source === "manual" || item.source === "lead" ? "reminder" : item.source,
    title: item.title,
    subtitle: [item.customerName, item.note].filter(Boolean).join(" · "),
    href: reminderHref(item),
    tone: item.source === "invoice" ? "danger" : "warning",
    dueDate: item.dueDate,
  }));

  const leadItems: InboxItem[] = (input.leads ?? [])
    .filter((lead) => lead.status === "new" || lead.status === "urgent" || lead.status === "in_progress")
    .map((lead) => ({
      id: `lead-${lead.id}`,
      kind: "lead" as const,
      title: lead.name,
      subtitle: `${lead.customerName} · ${lead.email}`,
      href: `/leads/${lead.id}`,
      tone: lead.status === "new" ? "warning" : "neutral",
      dueDate: lead.createdAt.slice(0, 10),
    }));

  return [...reminderItems, ...leadItems].sort((a, b) => {
    const toneRank = { danger: 0, warning: 1, neutral: 2 };
    const tone = toneRank[a.tone] - toneRank[b.tone];
    if (tone !== 0) return tone;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

export function inboxKindLabel(kind: InboxItem["kind"]): string {
  if (kind === "lead") return "Lead";
  if (kind === "invoice") return "Rechnung";
  if (kind === "quote") return "Angebot";
  if (kind === "contract") return "Vertrag";
  return "Erinnerung";
}
