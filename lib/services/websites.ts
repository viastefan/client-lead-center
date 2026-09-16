import type { SupabaseClient } from "@supabase/supabase-js";
import { generateApiKey, hashApiKey } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import type { VercelCustomerSite } from "@/lib/catalog/vercel-sites";
import type { Customer, EmailAccount, Website } from "@/types";

export const WEBSITE_COLUMNS =
  "id, customer_id, name, domain, status, active, api_key_hash, last_request_at, last_lead_at, vercel_project, vercel_url, github_repo, allowed_hosts, created_at, updated_at";

export type WebsiteListRow = Website & {
  customer: Pick<Customer, "id" | "company_name"> | null;
};

function normalizeWebsite(row: Website & { allowed_hosts?: string[] | null }): Website {
  return {
    ...row,
    vercel_project: row.vercel_project ?? null,
    vercel_url: row.vercel_url ?? null,
    github_repo: row.github_repo ?? null,
    allowed_hosts: row.allowed_hosts ?? [],
  };
}

export async function listWebsites(supabase: SupabaseClient): Promise<WebsiteListRow[]> {
  const { data, error } = await supabase
    .from("websites")
    .select(`${WEBSITE_COLUMNS}, customers(id, company_name)`)
    .order("name");

  if (error) {
    logger.warn("websites.list_failed", { message: error.message });
    return [];
  }

  return (data ?? []).map((row) => {
    const { customers, ...website } = row as Website & {
      customers: Pick<Customer, "id" | "company_name"> | Pick<Customer, "id" | "company_name">[] | null;
    };
    const customer = Array.isArray(customers) ? (customers[0] ?? null) : customers;
    return {
      ...normalizeWebsite(website as Website),
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
    .select(`${WEBSITE_COLUMNS}, customers(*)`)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logger.warn("websites.get_failed", { message: error.message });
    return null;
  }
  if (!data) {
    return null;
  }

  const { customers, ...website } = data as Website & {
    customers: Customer | Customer[] | null;
  };
  const customer = Array.isArray(customers) ? (customers[0] ?? null) : customers;
  return { ...normalizeWebsite(website as Website), customer };
}

export async function listWebsitesForCustomer(
  supabase: SupabaseClient,
  customerId: string,
): Promise<Website[]> {
  const { data, error } = await supabase
    .from("websites")
    .select(WEBSITE_COLUMNS)
    .eq("customer_id", customerId)
    .order("name");

  if (error) {
    logger.warn("websites.list_for_customer_failed", { message: error.message });
    return [];
  }

  return ((data ?? []) as Website[]).map(normalizeWebsite);
}

export async function getWebsiteByVercelProject(
  supabase: SupabaseClient,
  vercelProject: string,
): Promise<Website | null> {
  const { data, error } = await supabase
    .from("websites")
    .select(WEBSITE_COLUMNS)
    .eq("vercel_project", vercelProject)
    .maybeSingle();

  if (error) {
    logger.warn("websites.by_vercel_failed", { message: error.message });
    return null;
  }
  return data ? normalizeWebsite(data as Website) : null;
}

export async function createWebsite(
  supabase: SupabaseClient,
  input: {
    customerId: string;
    name: string;
    domain: string;
    status: "active" | "inactive" | "error";
    active: boolean;
    vercelProject?: string | null;
    vercelUrl?: string | null;
    githubRepo?: string | null;
    allowedHosts?: string[];
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
      vercel_project: input.vercelProject ?? null,
      vercel_url: input.vercelUrl ?? null,
      github_repo: input.githubRepo ?? null,
      allowed_hosts: input.allowedHosts ?? [],
    })
    .select(WEBSITE_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return { website: normalizeWebsite(data as Website), apiKey };
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
    logger.warn("email_accounts.list_for_customer_failed", { message: error.message });
    return [];
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
    logger.warn("email_accounts.list_failed", { message: error.message });
    return [];
  }

  return (data ?? []).map((row) => {
    const { customers, ...account } = row as EmailAccount & {
      customers: Pick<Customer, "company_name"> | Pick<Customer, "company_name">[] | null;
    };
    const customer = Array.isArray(customers) ? (customers[0] ?? null) : customers;
    return { ...(account as EmailAccount), customer };
  });
}

export async function findOrCreateCustomerForSite(
  supabase: SupabaseClient,
  site: VercelCustomerSite,
): Promise<Customer> {
  const { data: existing } = await supabase
    .from("customers")
    .select(
      "id, name, company_name, contact_name, contact_email, contact_phone, status, notes, created_at, updated_at",
    )
    .eq("company_name", site.companyName)
    .maybeSingle();

  if (existing) {
    return existing as Customer;
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: site.companyName,
      company_name: site.companyName,
      contact_name: site.contactName,
      contact_email: site.contactEmail,
      status: "active",
      notes: `Live Vercel-Projekt ${site.slug}`,
    })
    .select(
      "id, name, company_name, contact_name, contact_email, contact_phone, status, notes, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }
  return data as Customer;
}
