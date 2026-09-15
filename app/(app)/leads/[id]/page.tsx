import { notFound } from "next/navigation";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getLead, listConversationsForLead } from "@/lib/services/leads";
import { formatDateTime, leadStatusLabel, priorityLabel } from "@/lib/format";
import { updateLeadAction } from "@/lib/actions";
import { LEAD_PRIORITIES, LEAD_STATUSES } from "@/types";

export const metadata = { title: "Lead" };

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const lead = await getLead(supabase, id);
  if (!lead) notFound();
  const conversations = await listConversationsForLead(supabase, lead.id, lead.customer_id);

  return (
    <>
      <PageHeader title={lead.name} description={lead.email} />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <Panel title="Nachricht">
            <p className="whitespace-pre-wrap text-sm leading-7">{lead.message}</p>
          </Panel>

          <Panel title="Conversation">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted">Noch keine Unterhaltung.</p>
            ) : (
              <ol className="space-y-6">
                {conversations.flatMap((conversation) =>
                  conversation.messages.map((message) => (
                    <li key={message.id}>
                      <p className="text-xs uppercase tracking-wide text-subtle">
                        {conversation.channel} · {formatDateTime(message.created_at)}
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {message.direction === "inbound" ? "Neue Anfrage" : "Antwort"}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{message.body}</p>
                    </li>
                  )),
                )}
              </ol>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Details">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-subtle">Kunde</dt>
                <dd className="mt-1">{lead.customer?.company_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-subtle">Website</dt>
                <dd className="mt-1">{lead.website?.domain ?? "—"}</dd>
              </div>
              <div className="flex gap-2">
                <StatusBadge>{leadStatusLabel(lead.status)}</StatusBadge>
                <StatusBadge>{priorityLabel(lead.priority)}</StatusBadge>
              </div>
            </dl>
          </Panel>

          <Panel title="Actions">
            <form action={updateLeadAction.bind(null, lead.id)} className="space-y-4">
              <label className="block text-sm">
                <span className="mb-2 block text-muted">Status ändern</span>
                <select name="status" defaultValue={lead.status} className="h-10 w-full rounded-lg border border-border bg-background px-3">
                  {LEAD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {leadStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-muted">Priorität ändern</span>
                <select name="priority" defaultValue={lead.priority} className="h-10 w-full rounded-lg border border-border bg-background px-3">
                  {LEAD_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priorityLabel(priority)}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="h-9 rounded-lg bg-accent px-3 text-sm text-white">
                Speichern
              </button>
            </form>
            <form action={updateLeadAction.bind(null, lead.id)} className="mt-3">
              <input type="hidden" name="status" value="closed" />
              <button type="submit" className="h-9 rounded-lg border border-border px-3 text-sm">
                Als erledigt markieren
              </button>
            </form>
            <p className="mt-4 text-xs leading-5 text-subtle">
              E-Mail senden ist vorbereitet, sobald eine Mailbox verbunden ist. In V1 noch nicht aktiv.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
