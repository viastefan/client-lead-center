import { VERCEL_CUSTOMER_SITES } from "@/lib/catalog/vercel-sites";
import type { DashboardStats } from "@/lib/services/dashboard";
import type { CustomerListRow } from "@/lib/services/customers";
import type { LeadFilters, LeadListRow } from "@/lib/services/leads";
import type { WebsiteListRow } from "@/lib/services/websites";
import type {
  Conversation,
  Customer,
  Lead,
  LeadPriority,
  LeadStatus,
  Message,
  SessionUser,
  Website,
} from "@/types";

const NOW = "2026-09-16T08:30:00.000Z";

export const PREVIEW_USER: SessionUser = {
  id: "preview-ops",
  email: "ops@client-lead-center.app",
  profile: {
    id: "preview-ops",
    role: "super_admin",
    customer_id: null,
    full_name: "Operations",
    created_at: NOW,
    updated_at: NOW,
  },
};

const SAMPLE_LEADS: Array<{
  name: string;
  email: string;
  message: string;
  status: LeadStatus;
  priority: LeadPriority;
  hoursAgo: number;
}> = [
  {
    name: "Anna Keller",
    email: "anna.keller@icloud.com",
    message: "Guten Tag, wir suchen eine 4-Zimmer-Wohnung in Schwabing und hätten gerne zeitnah eine Besichtigung.",
    status: "new",
    priority: "high",
    hoursAgo: 2,
  },
  {
    name: "Jonas Weber",
    email: "jonas.weber@gmail.com",
    message: "Hallo, bitte um ein Catering-Angebot für 18 Personen am Freitagabend. Scharf, aber ohne Erdnüsse.",
    status: "in_progress",
    priority: "normal",
    hoursAgo: 5,
  },
  {
    name: "Lisa Hoffmann",
    email: "lisa.hoffmann@outlook.de",
    message: "Wir brauchen stabile Luftfrachtverpackungen für empfindliche Elektronik nach Doha. Können Sie morgen anrufen?",
    status: "waiting",
    priority: "urgent",
    hoursAgo: 9,
  },
  {
    name: "Thomas Bauer",
    email: "t.bauer@wascotextil-kunde.de",
    message: "Anfrage zu Steppstoffen in kleiner Auflage. Bitte Muster und Lieferzeit.",
    status: "replied",
    priority: "normal",
    hoursAgo: 20,
  },
  {
    name: "Mira Engel",
    email: "mira.engel@festag.example",
    message: "Wir möchten ein Event in München planen. Passt nächste Woche ein kurzes Gespräch?",
    status: "qualified",
    priority: "high",
    hoursAgo: 28,
  },
  {
    name: "Paul Richter",
    email: "paul.richter@eride.example",
    message: "Interesse an einer Probefahrt und Beratung zum Custom-Request für ein E-Bike.",
    status: "new",
    priority: "normal",
    hoursAgo: 31,
  },
];

function hoursAgoIso(hours: number): string {
  return new Date(Date.parse(NOW) - hours * 60 * 60 * 1000).toISOString();
}

export function demoCustomerId(slug: string): string {
  return `demo-customer-${slug}`;
}

export function demoWebsiteId(slug: string): string {
  return `demo-website-${slug}`;
}

export function demoLeadId(index: number): string {
  return `demo-lead-${index + 1}`;
}

export function demoCustomers(): Customer[] {
  return VERCEL_CUSTOMER_SITES.map((site) => ({
    id: demoCustomerId(site.slug),
    name: site.slug,
    company_name: site.companyName,
    contact_name: site.contactName,
    contact_email: site.contactEmail,
    contact_phone: null,
    status: "active",
    notes: `Live auf Vercel · ${site.domain}`,
    created_at: NOW,
    updated_at: NOW,
  }));
}

export function demoWebsites(): Website[] {
  return VERCEL_CUSTOMER_SITES.map((site) => ({
    id: demoWebsiteId(site.slug),
    customer_id: demoCustomerId(site.slug),
    name: site.websiteName,
    domain: site.domain,
    status: "active",
    active: true,
    api_key_hash: "preview",
    last_request_at: hoursAgoIso(3),
    last_lead_at: hoursAgoIso(4),
    vercel_project: site.slug,
    vercel_url: site.vercelUrl,
    github_repo: site.githubRepo,
    allowed_hosts: site.allowedHosts,
    created_at: NOW,
    updated_at: NOW,
  }));
}

export function demoWebsiteRows(): WebsiteListRow[] {
  const customers = new Map(demoCustomers().map((customer) => [customer.id, customer]));
  return demoWebsites().map((website) => ({
    ...website,
    customer: customers.get(website.customer_id)
      ? { id: website.customer_id, company_name: customers.get(website.customer_id)!.company_name }
      : null,
  }));
}

export function demoCustomerRows(): CustomerListRow[] {
  const websites = demoWebsites();
  const leads = demoLeads();
  return demoCustomers().map((customer) => {
    const customerLeads = leads.filter((lead) => lead.customer_id === customer.id);
    return {
      ...customer,
      website_count: websites.filter((site) => site.customer_id === customer.id).length,
      lead_count: customerLeads.length,
      email_status: null,
      last_activity_at: customerLeads[0]?.created_at ?? customer.updated_at,
    };
  });
}

export function demoLeads(): LeadListRow[] {
  const sites = VERCEL_CUSTOMER_SITES;
  return SAMPLE_LEADS.map((sample, index) => {
    const site = sites[index % sites.length];
    const created = hoursAgoIso(sample.hoursAgo);
    const lead: Lead = {
      id: demoLeadId(index),
      customer_id: demoCustomerId(site.slug),
      website_id: demoWebsiteId(site.slug),
      name: sample.name,
      email: sample.email,
      phone: null,
      company: site.companyName,
      message: sample.message,
      source: "website",
      page_url: `https://${site.domain.replace(/^www\./, "")}/kontakt`,
      metadata: { preview: true },
      status: sample.status,
      priority: sample.priority,
      created_at: created,
      updated_at: created,
    };
    return {
      ...lead,
      customer: { id: demoCustomerId(site.slug), company_name: site.companyName },
      website: {
        id: demoWebsiteId(site.slug),
        name: site.websiteName,
        domain: site.domain,
      },
    };
  });
}

export function filterDemoLeads(filters: LeadFilters = {}): LeadListRow[] {
  return demoLeads().filter((lead) => {
    if (filters.status && filters.status !== "all" && lead.status !== filters.status) return false;
    if (filters.customerId && lead.customer_id !== filters.customerId) return false;
    if (filters.websiteId && lead.website_id !== filters.websiteId) return false;
    if (filters.priority && lead.priority !== filters.priority) return false;
    if (filters.source && lead.source !== filters.source) return false;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const haystack = `${lead.name} ${lead.email} ${lead.message}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function demoDashboardStats(): DashboardStats {
  const customers = demoCustomerRows();
  const websites = demoWebsiteRows();
  const leads = demoLeads();
  const openStatuses = new Set(["new", "in_progress", "waiting", "replied", "qualified"]);
  return {
    customerCount: customers.length,
    activeCustomerCount: customers.length,
    websiteCount: websites.length,
    activeWebsiteCount: websites.length,
    websites,
    newLeadCount: leads.filter((lead) => lead.status === "new").length,
    openLeadCount: leads.filter((lead) => openStatuses.has(lead.status)).length,
    recentLeads: leads.slice(0, 6).map((lead) => ({
      id: lead.id,
      status: lead.status,
      name: lead.name,
      email: lead.email,
      created_at: lead.created_at,
      customer_id: lead.customer_id,
      customers: lead.customer,
    })),
    customers,
    activities: leads.slice(0, 5).map((lead) => ({
      id: `demo-activity-${lead.id}`,
      action: `lead.${lead.status}`,
      entity_type: "lead",
      created_at: lead.created_at,
      customer_id: lead.customer_id,
    })),
    migrationMissing: false,
  };
}

export function demoConversations(leadId: string): (Conversation & { messages: Message[] })[] {
  const lead = demoLeads().find((item) => item.id === leadId);
  if (!lead) return [];
  const conversationId = `demo-convo-${leadId}`;
  return [
    {
      id: conversationId,
      customer_id: lead.customer_id,
      lead_id: lead.id,
      channel: "website",
      status: "open",
      created_at: lead.created_at,
      updated_at: lead.created_at,
      messages: [
        {
          id: `${conversationId}-1`,
          customer_id: lead.customer_id,
          conversation_id: conversationId,
          direction: "inbound",
          sender_name: lead.name,
          sender_email: lead.email,
          recipient_email: lead.customer?.company_name ?? null,
          subject: "Website-Anfrage",
          body: lead.message,
          message_type: "website",
          ai_generated: false,
          created_at: lead.created_at,
        },
      ],
    },
  ];
}

export function demoAutomations() {
  return demoCustomers().slice(0, 3).map((customer, index) => ({
    id: `demo-auto-${index + 1}`,
    customer_id: customer.id,
    name: index === 0 ? "Neue Leads benachrichtigen" : index === 1 ? "Eingangsbestätigung" : "KI-Erstanalyse",
    trigger: "lead.created",
    action: index === 0 ? "notify_client" : index === 1 ? "send_confirmation" : "analyze_with_ai",
    enabled: index !== 2,
    customers: { company_name: customer.company_name },
  }));
}
