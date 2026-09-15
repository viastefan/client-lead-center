import type { SupabaseClient } from "@supabase/supabase-js";
import { enqueueAutomationEvent } from "@/lib/automations";
import { writeAuditLog } from "@/lib/services/audit";
import type { CreateLeadInput } from "@/lib/validations";
import type { Lead } from "@/types";

export async function ingestWebsiteLead(
  supabase: SupabaseClient,
  input: CreateLeadInput,
  websiteId: string,
  customerId: string,
): Promise<Lead> {
  const status = input._gotcha ? "spam" : "new";

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      customer_id: customerId,
      website_id: websiteId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      message: input.message,
      source: input.source,
      page_url: input.pageUrl,
      metadata: { ...input.metadata, spam_honeypot: Boolean(input._gotcha) },
      status,
      priority: "normal",
    })
    .select(
      "id, customer_id, website_id, name, email, phone, company, message, source, page_url, metadata, status, priority, created_at, updated_at",
    )
    .single();

  if (leadError) {
    throw leadError;
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      customer_id: customerId,
      lead_id: lead.id,
      channel: "website",
      status: "open",
    })
    .select("id")
    .single();

  if (conversationError) {
    throw conversationError;
  }

  const { error: messageError } = await supabase.from("messages").insert({
    customer_id: customerId,
    conversation_id: conversation.id,
    direction: "inbound",
    sender_name: input.name,
    sender_email: input.email,
    body: input.message,
    message_type: "website",
    ai_generated: false,
  });

  if (messageError) {
    throw messageError;
  }

  const { error: eventError } = await supabase.from("lead_events").insert({
    customer_id: customerId,
    lead_id: lead.id,
    event_type: "lead.created",
    payload: {
      websiteId,
      source: input.source,
    },
  });

  if (eventError) {
    throw eventError;
  }

  await supabase
    .from("websites")
    .update({
      last_request_at: new Date().toISOString(),
      last_lead_at: new Date().toISOString(),
    })
    .eq("id", websiteId)
    .eq("customer_id", customerId);

  await writeAuditLog(supabase, {
    customerId,
    action: "lead.created",
    entityType: "lead",
    entityId: lead.id,
    metadata: { websiteId, source: input.source },
  });

  await enqueueAutomationEvent({
    type: "lead.created",
    customerId,
    leadId: lead.id,
    payload: { websiteId },
  });

  return lead as Lead;
}
