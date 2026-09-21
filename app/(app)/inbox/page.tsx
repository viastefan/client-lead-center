import { InboxBoard } from "@/components/ops/inbox-board";
import { loadLeads } from "@/lib/data/workspace";
import type { InboxLead } from "@/lib/ops/inbox";

export const metadata = { title: "Inbox" };

export default async function InboxPage() {
  const leads = await loadLeads();
  const rows: InboxLead[] = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    status: lead.status,
    customerName: lead.customer?.company_name ?? "Kunde",
    createdAt: lead.created_at,
    customerId: lead.customer_id,
  }));
  return <InboxBoard leads={rows} />;
}
