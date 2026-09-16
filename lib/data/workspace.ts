import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  demoAutomations,
  demoConversations,
  demoCustomerRows,
  demoCustomers,
  demoDashboardStats,
  demoLeads,
  demoWebsiteRows,
  demoWebsites,
  filterDemoLeads,
  PREVIEW_USER,
} from "@/lib/demo/workspace";
import { getCustomer, listCustomers, type CustomerListRow } from "@/lib/services/customers";
import { getDashboardStats, type DashboardStats } from "@/lib/services/dashboard";
import {
  getLead,
  listConversationsForLead,
  listLeads,
  type LeadFilters,
  type LeadListRow,
} from "@/lib/services/leads";
import {
  getWebsite,
  listEmailAccounts,
  listEmailAccountsForCustomer,
  listWebsites,
  listWebsitesForCustomer,
  type WebsiteListRow,
} from "@/lib/services/websites";
import type { Customer, SessionUser, Website } from "@/types";

export function isPreviewMode(): boolean {
  return !isSupabaseConfigured();
}

export function previewUser(): SessionUser {
  return PREVIEW_USER;
}

export async function loadDashboardStats(): Promise<DashboardStats> {
  if (isPreviewMode()) return demoDashboardStats();
  return getDashboardStats(await createClient());
}

export async function loadCustomers(): Promise<CustomerListRow[]> {
  if (isPreviewMode()) return demoCustomerRows();
  return listCustomers(await createClient());
}

export async function loadCustomer(id: string): Promise<Customer | null> {
  if (isPreviewMode()) return demoCustomers().find((customer) => customer.id === id) ?? null;
  return getCustomer(await createClient(), id);
}

export async function loadWebsites(): Promise<WebsiteListRow[]> {
  if (isPreviewMode()) return demoWebsiteRows();
  return listWebsites(await createClient());
}

export async function loadWebsite(id: string): Promise<(Website & { customer: Customer | null }) | null> {
  if (isPreviewMode()) {
    const website = demoWebsites().find((item) => item.id === id);
    if (!website) return null;
    const customer = demoCustomers().find((item) => item.id === website.customer_id) ?? null;
    return { ...website, customer };
  }
  return getWebsite(await createClient(), id);
}

export async function loadWebsitesForCustomer(customerId: string): Promise<Website[]> {
  if (isPreviewMode()) return demoWebsites().filter((site) => site.customer_id === customerId);
  return listWebsitesForCustomer(await createClient(), customerId);
}

export async function loadLeads(filters: LeadFilters = {}): Promise<LeadListRow[]> {
  if (isPreviewMode()) return filterDemoLeads(filters);
  return listLeads(await createClient(), filters);
}

export async function loadLead(id: string): Promise<LeadListRow | null> {
  if (isPreviewMode()) return demoLeads().find((lead) => lead.id === id) ?? null;
  return getLead(await createClient(), id);
}

export async function loadConversations(leadId: string, customerId: string) {
  if (isPreviewMode()) return demoConversations(leadId);
  return listConversationsForLead(await createClient(), leadId, customerId);
}

export async function loadEmailAccounts() {
  if (isPreviewMode()) return [];
  return listEmailAccounts(await createClient());
}

export async function loadEmailAccountsForCustomer(customerId: string) {
  if (isPreviewMode()) return [];
  return listEmailAccountsForCustomer(await createClient(), customerId);
}

export async function loadAutomations() {
  if (isPreviewMode()) return demoAutomations();
  const supabase = await createClient();
  const { data } = await supabase
    .from("automations")
    .select("id, name, trigger, action, enabled, customers(company_name)")
    .order("name");
  return (data ?? []).map((item) => {
    const customer = Array.isArray(item.customers) ? item.customers[0] : item.customers;
    return {
      id: item.id as string,
      name: item.name as string,
      trigger: item.trigger as string,
      action: item.action as string,
      enabled: Boolean(item.enabled),
      customers: customer ? { company_name: customer.company_name as string } : null,
    };
  });
}

export async function loadAutomationsForCustomer(customerId: string) {
  if (isPreviewMode()) {
    return demoAutomations()
      .filter((item) => item.customer_id === customerId)
      .map((item) => ({
        id: item.id,
        name: item.name,
        trigger: item.trigger,
        action: item.action,
        enabled: item.enabled,
      }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("automations")
    .select("id, name, trigger, action, enabled")
    .eq("customer_id", customerId);
  return data ?? [];
}
