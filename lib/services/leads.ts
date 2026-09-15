import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation, Customer, Lead, LeadPriority, LeadStatus, Message, Website } from "@/types";

export type LeadListRow = Lead & {
  customer: Pick<Customer, "id" | "company_name"> | null;
  website: Pick<Website, "id" | "name" | "domain"> | null;
};

export type LeadFilters = {
  status?: LeadStatus | "all";
  customerId?: string;
  websiteId?: string;
  priority?: LeadPriority;
  source?: string;
  query?: string;
  from?: string;
  to?: string;
};

export async function listLeads(
  supabase: SupabaseClient,
  filters: LeadFilters = {},
): Promise<LeadListRow[]> {
  let query = supabase
    .from("leads")
    .select(
      "id, customer_id, website_id, name, email, phone, company, message, source, page_url, metadata, status, priority, created_at, updated_at, customers(id, company_name), websites(id, name, domain)",
    )
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }
  if (filters.websiteId) {
    query = query.eq("website_id", filters.websiteId);
  }
  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters.source) {
    query = query.eq("source", filters.source);
  }
  if (filters.from) {
    query = query.gte("created_at", filters.from);
  }
  if (filters.to) {
    query = query.lte("created_at", filters.to);
  }
  if (filters.query) {
    const escaped = filters.query.replace(/%/g, "\\%");
    query = query.or(
      `name.ilike.%${escaped}%,email.ilike.%${escaped}%,message.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const { customers, websites, ...lead } = row as Lead & {
      customers: Pick<Customer, "id" | "company_name"> | Pick<Customer, "id" | "company_name">[] | null;
      websites: Pick<Website, "id" | "name" | "domain"> | Pick<Website, "id" | "name" | "domain">[] | null;
    };
    return {
      ...(lead as Lead),
      customer: Array.isArray(customers) ? customers[0] ?? null : customers,
      website: Array.isArray(websites) ? websites[0] ?? null : websites,
    };
  });
}

export async function getLead(
  supabase: SupabaseClient,
  id: string,
  customerId?: string,
): Promise<LeadListRow | null> {
  let query = supabase
    .from("leads")
    .select(
      "id, customer_id, website_id, name, email, phone, company, message, source, page_url, metadata, status, priority, created_at, updated_at, customers(id, company_name), websites(id, name, domain)",
    )
    .eq("id", id);

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  const { customers, websites, ...lead } = data as Lead & {
    customers: Pick<Customer, "id" | "company_name"> | Pick<Customer, "id" | "company_name">[] | null;
    websites: Pick<Website, "id" | "name" | "domain"> | Pick<Website, "id" | "name" | "domain">[] | null;
  };

  return {
    ...(lead as Lead),
    customer: Array.isArray(customers) ? customers[0] ?? null : customers,
    website: Array.isArray(websites) ? websites[0] ?? null : websites,
  };
}

export async function updateLead(
  supabase: SupabaseClient,
  id: string,
  customerId: string,
  patch: { status?: LeadStatus; priority?: LeadPriority },
) {
  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", id)
    .eq("customer_id", customerId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("Lead not found for this customer.");
  }
}

export async function listConversationsForLead(
  supabase: SupabaseClient,
  leadId: string,
  customerId: string,
): Promise<(Conversation & { messages: Message[] })[]> {
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("id, customer_id, lead_id, channel, status, created_at, updated_at")
    .eq("lead_id", leadId)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const ids = (conversations ?? []).map((row) => row.id);
  if (ids.length === 0) {
    return [];
  }

  const { data: messages, error: messageError } = await supabase
    .from("messages")
    .select(
      "id, customer_id, conversation_id, direction, sender_name, sender_email, recipient_email, subject, body, message_type, ai_generated, created_at",
    )
    .in("conversation_id", ids)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true });

  if (messageError) {
    throw messageError;
  }

  return (conversations ?? []).map((conversation) => ({
    ...(conversation as Conversation),
    messages: (messages ?? []).filter(
      (message) => message.conversation_id === conversation.id,
    ) as Message[],
  }));
}

export async function countLeadsByStatus(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("leads").select("status");
  if (error) {
    throw error;
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}
