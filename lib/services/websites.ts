import type { SupabaseClient } from "@supabase/supabase-js";
import { generateApiKey, hashApiKey } from "@/lib/crypto";
import type { Customer, EmailAccount, Website } from "@/types";

export type WebsiteListRow = Website & {
  customer: Pick<Customer, "id" | "company_name"> | null;
  last_lead_at: string | null;
};

export async function listWebsites(supabase: SupabaseClient): Promise<WebsiteListRow[]> {
  const { data, error } = await supabase
    .from("websites")
    .select(
      "id, customer_id, name, domain, status, active, api_key_hash, last_request_at, last_lead_at, created_at, updated_at, customers(id, company_name)",
    )
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const { customers, ...website } = row as Website & {
      customers: Pick<Customer, "id" | "company_name"> | Pick<Customer, "id" | "company_name">[] | null;
    };
    const customer = Array.isArray(customers) ? customers[0] ?? null : customers;
    return {
      ...(website as Website),
      customer,
    };
  });
}

export async function getWebsite(
  supabase: SupabaseClient,
  id: string,
): Promise<(Website & { customer: Customer | null }) | null> {
  const { data, error } = await supabase
    .from("websites")
    .select(
      "id, customer_id, name, domain, status, active, api_key_hash, last_request_at, last_lead_at, created_at, updated_at, customers(*)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  const { customers, ...website } = data as Website & {
    customers: Customer | Customer[] | null;
  };
  const customer = Array.isArray(customers) ? customers[0] ?? null : customers;
  return { ...(website as Website), customer };
}

export async function listWebsitesForCustomer(
  supabase: SupabaseClient,
  customerId: string,
): Promise<Website[]> {
  const { data, error } = await supabase
    .from("websites")
    .select(
      "id, customer_id, name, domain, status, active, api_key_hash, last_request_at, last_lead_at, created_at, updated_at",
    )
    .eq("customer_id", customerId)
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []) as Website[];
}

export async function createWebsite(
  supabase: SupabaseClient,
  input: {
    customerId: string;
    name: string;
    domain: string;
    status: "active" | "inactive" | "error";
    active: boolean;
  },
): Promise<{ website: Website; apiKey: string }> {
  const apiKey = generateApiKey();
  const { data, error } = await supabase
    .from("websites")
    .insert({
      customer_id: input.customerId,
      name: input.name,
      domain: input.domain,
      status: input.status,
      active: input.active,
      api_key_hash: hashApiKey(apiKey),
    })
    .select(
      "id, customer_id, name, domain, status, active, api_key_hash, last_request_at, last_lead_at, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return { website: data as Website, apiKey };
}

export async function rotateWebsiteApiKey(
  supabase: SupabaseClient,
  websiteId: string,
  customerId: string,
): Promise<string> {
  const apiKey = generateApiKey();
  const { data, error } = await supabase
    .from("websites")
    .update({ api_key_hash: hashApiKey(apiKey) })
    .eq("id", websiteId)
    .eq("customer_id", customerId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("Website not found for this customer.");
  }

  return apiKey;
}

export async function listEmailAccountsForCustomer(
  supabase: SupabaseClient,
  customerId: string,
): Promise<EmailAccount[]> {
  const { data, error } = await supabase
    .from("email_accounts")
    .select("id, customer_id, provider, email, display_name, status, created_at, updated_at")
    .eq("customer_id", customerId)
    .order("email");

  if (error) {
    throw error;
  }

  return (data ?? []) as EmailAccount[];
}

export async function listEmailAccounts(supabase: SupabaseClient): Promise<
  (EmailAccount & { customer: Pick<Customer, "company_name"> | null })[]
> {
  const { data, error } = await supabase
    .from("email_accounts")
    .select(
      "id, customer_id, provider, email, display_name, status, created_at, updated_at, customers(company_name)",
    )
    .order("email");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const { customers, ...account } = row as EmailAccount & {
      customers: Pick<Customer, "company_name"> | Pick<Customer, "company_name">[] | null;
    };
    const customer = Array.isArray(customers) ? customers[0] ?? null : customers;
    return { ...(account as EmailAccount), customer };
  });
}
