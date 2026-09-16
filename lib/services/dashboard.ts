import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export type DashboardStats = {
  customerCount: number;
  activeCustomerCount: number;
  websiteCount: number;
  activeWebsiteCount: number;
  websites: Array<{
    id: string;
    active?: boolean | null;
    status?: string | null;
    vercel_project?: string | null;
    domain: string;
    github_repo?: string | null;
    vercel_url?: string | null;
  }>;
  newLeadCount: number;
  openLeadCount: number;
  recentLeads: Array<{
    id: string;
    status: string;
    name: string;
    email: string;
    created_at: string;
    customer_id: string;
    customers: { company_name: string } | { company_name: string }[] | null;
  }>;
  customers: Array<{
    id: string;
    status: string;
    company_name: string;
    updated_at: string;
  }>;
  activities: Array<{
    id: string;
    action: string;
    entity_type: string;
    created_at: string;
    customer_id: string | null;
  }>;
  migrationMissing: boolean;
};

const EMPTY_STATS: DashboardStats = {
  customerCount: 0,
  activeCustomerCount: 0,
  websiteCount: 0,
  activeWebsiteCount: 0,
  websites: [],
  newLeadCount: 0,
  openLeadCount: 0,
  recentLeads: [],
  customers: [],
  activities: [],
  migrationMissing: true,
};

export async function getDashboardStats(supabase: SupabaseClient): Promise<DashboardStats> {
  try {
    const [customers, websitesPrimary, leads, activities] = await Promise.all([
      supabase.from("customers").select("id, status, company_name, updated_at"),
      supabase.from("websites").select("id, active, status, vercel_project, domain, github_repo, vercel_url"),
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

    const websites = websitesPrimary.error
      ? await supabase.from("websites").select("id, active, status, domain")
      : websitesPrimary;

    if (customers.error || websites.error || leads.error || activities.error) {
      logger.warn("dashboard.query_failed", {
        customers: customers.error?.message,
        websites: websites.error?.message,
        leads: leads.error?.message,
        activities: activities.error?.message,
      });
      return EMPTY_STATS;
    }

    const leadRows = leads.data ?? [];
    const openStatuses = new Set(["new", "in_progress", "waiting", "replied", "qualified"]);

    return {
      customerCount: customers.data?.length ?? 0,
      activeCustomerCount: customers.data?.filter((row) => row.status === "active").length ?? 0,
      websiteCount: websites.data?.length ?? 0,
      activeWebsiteCount: websites.data?.filter((row) => row.active).length ?? 0,
      websites: websites.data ?? [],
      newLeadCount: leadRows.filter((row) => row.status === "new").length,
      openLeadCount: leadRows.filter((row) => openStatuses.has(row.status)).length,
      recentLeads: leadRows.slice(0, 6),
      customers: customers.data ?? [],
      activities: activities.data ?? [],
      migrationMissing: false,
    };
  } catch (error) {
    logger.error("dashboard.unhandled", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return EMPTY_STATS;
  }
}
