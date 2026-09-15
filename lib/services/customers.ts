import type { SupabaseClient } from "@supabase/supabase-js";
import type { Customer } from "@/types";

export type CustomerListRow = Customer & {
  website_count: number;
  lead_count: number;
  email_status: string | null;
  last_activity_at: string | null;
};

export async function listCustomers(supabase: SupabaseClient): Promise<CustomerListRow[]> {
  const { data: customers, error } = await supabase
    .from("customers")
    .select(
      "id, name, company_name, contact_name, contact_email, contact_phone, status, notes, created_at, updated_at",
    )
    .order("company_name");

  if (error) {
    throw error;
  }

  const ids = (customers ?? []).map((customer) => customer.id);
  if (ids.length === 0) {
    return [];
  }

  const [websites, leads, emails] = await Promise.all([
    supabase.from("websites").select("id, customer_id").in("customer_id", ids),
    supabase.from("leads").select("id, customer_id, created_at").in("customer_id", ids),
    supabase.from("email_accounts").select("customer_id, status").in("customer_id", ids),
  ]);

  if (websites.error) throw websites.error;
  if (leads.error) throw leads.error;
  if (emails.error) throw emails.error;

  return (customers ?? []).map((customer) => {
    const customerWebsites = websites.data?.filter((row) => row.customer_id === customer.id) ?? [];
    const customerLeads = leads.data?.filter((row) => row.customer_id === customer.id) ?? [];
    const customerEmails = emails.data?.filter((row) => row.customer_id === customer.id) ?? [];
    const lastLead = customerLeads
      .map((row) => row.created_at)
      .sort()
      .at(-1);

    return {
      ...(customer as Customer),
      website_count: customerWebsites.length,
      lead_count: customerLeads.length,
      email_status: customerEmails[0]?.status ?? null,
      last_activity_at: lastLead ?? customer.updated_at,
    };
  });
}

export async function getCustomer(
  supabase: SupabaseClient,
  id: string,
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, name, company_name, contact_name, contact_email, contact_phone, status, notes, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as Customer | null) ?? null;
}

export async function createCustomer(
  supabase: SupabaseClient,
  input: {
    name: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string | null;
    status: "active" | "inactive";
    notes?: string | null;
  },
): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: input.name,
      company_name: input.companyName,
      contact_name: input.contactName,
      contact_email: input.contactEmail,
      contact_phone: input.contactPhone ?? null,
      status: input.status,
      notes: input.notes ?? null,
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

export async function updateCustomerStatus(
  supabase: SupabaseClient,
  id: string,
  status: "active" | "inactive",
) {
  const { error } = await supabase.from("customers").update({ status }).eq("id", id);
  if (error) {
    throw error;
  }
}
