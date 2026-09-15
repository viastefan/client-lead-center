import type { SupabaseClient } from "@supabase/supabase-js";

export async function getDashboardStats(supabase: SupabaseClient) {
  const [customers, websites, leads, activities] = await Promise.all([
    supabase.from("customers").select("id, status, company_name, updated_at"),
    supabase.from("websites").select("id, active, status"),
    supabase
      .from("leads")
      .select("id, status, name, email, created_at, customer_id, customers(company_name)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("audit_logs")
      .select("id, action, entity_type, created_at, customer_id")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (customers.error) throw customers.error;
  if (websites.error) throw websites.error;
  if (leads.error) throw leads.error;
  if (activities.error) throw activities.error;

  const leadRows = leads.data ?? [];
  const openStatuses = new Set(["new", "in_progress", "waiting", "replied", "qualified"]);

  return {
    customerCount: customers.data?.length ?? 0,
    activeCustomerCount: customers.data?.filter((row) => row.status === "active").length ?? 0,
    websiteCount: websites.data?.length ?? 0,
    activeWebsiteCount: websites.data?.filter((row) => row.active).length ?? 0,
    newLeadCount: leadRows.filter((row) => row.status === "new").length,
    openLeadCount: leadRows.filter((row) => openStatuses.has(row.status)).length,
    recentLeads: leadRows.slice(0, 6),
    customers: customers.data ?? [],
    activities: activities.data ?? [],
  };
}
