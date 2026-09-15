"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole, requireSessionUser } from "@/lib/auth/session";
import { customerInputSchema, leadPatchSchema, websiteInputSchema } from "@/lib/validations";
import { createCustomer, updateCustomerStatus } from "@/lib/services/customers";
import { createWebsite, rotateWebsiteApiKey } from "@/lib/services/websites";
import { getLead, updateLead } from "@/lib/services/leads";
import { writeAuditLog } from "@/lib/services/audit";

export type ActionState = {
  error?: string;
  apiKey?: string;
};

export async function createCustomerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireSessionUser();
  if (!isAdminRole(user.profile?.role)) {
    return { error: "Nur Administratoren können Kunden anlegen." };
  }

  const parsed = customerInputSchema.safeParse({
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone") || null,
    status: formData.get("status") || "active",
    notes: formData.get("notes") || null,
  });

  if (!parsed.success) {
    return { error: "Bitte prüfen Sie die eingegebenen Daten." };
  }

  const supabase = await createClient();
  const customer = await createCustomer(supabase, parsed.data);
  await writeAuditLog(supabase, {
    userId: user.id,
    customerId: customer.id,
    action: "customer.created",
    entityType: "customer",
    entityId: customer.id,
  });
  revalidatePath("/clients");
  redirect(`/clients/${customer.id}`);
}

export async function toggleCustomerStatusAction(customerId: string, status: "active" | "inactive") {
  const user = await requireSessionUser();
  if (!isAdminRole(user.profile?.role)) {
    throw new Error("Keine Berechtigung.");
  }
  const supabase = await createClient();
  await updateCustomerStatus(supabase, customerId, status);
  await writeAuditLog(supabase, {
    userId: user.id,
    customerId,
    action: status === "inactive" ? "customer.deactivated" : "customer.activated",
    entityType: "customer",
    entityId: customerId,
  });
  revalidatePath("/clients");
  revalidatePath(`/clients/${customerId}`);
}

export async function createWebsiteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireSessionUser();
  if (!isAdminRole(user.profile?.role)) {
    return { error: "Nur Administratoren können Websites anlegen." };
  }
  const parsed = websiteInputSchema.safeParse({
    customerId: formData.get("customerId"),
    name: formData.get("name"),
    domain: formData.get("domain"),
    status: "active",
    active: true,
  });
  if (!parsed.success) {
    return { error: "Bitte prüfen Sie die Website-Daten." };
  }
  const supabase = await createClient();
  const { website, apiKey } = await createWebsite(supabase, parsed.data);
  await writeAuditLog(supabase, {
    userId: user.id,
    customerId: website.customer_id,
    action: "website.created",
    entityType: "website",
    entityId: website.id,
  });
  revalidatePath("/websites");
  revalidatePath(`/clients/${website.customer_id}`);
  return { apiKey };
}

export async function rotateApiKeyAction(websiteId: string): Promise<ActionState> {
  const user = await requireSessionUser();
  if (!isAdminRole(user.profile?.role)) {
    return { error: "Keine Berechtigung." };
  }
  const supabase = await createClient();
  const { getWebsite } = await import("@/lib/services/websites");
  const website = await getWebsite(supabase, websiteId);
  if (!website) {
    return { error: "Website nicht gefunden." };
  }
  const apiKey = await rotateWebsiteApiKey(supabase, website.id, website.customer_id);
  await writeAuditLog(supabase, {
    userId: user.id,
    customerId: website.customer_id,
    action: "website.api_key_rotated",
    entityType: "website",
    entityId: website.id,
  });
  revalidatePath(`/websites/${website.id}`);
  return { apiKey };
}

export async function updateLeadAction(leadId: string, formData: FormData) {
  const user = await requireSessionUser();
  const parsed = leadPatchSchema.safeParse({
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
  });
  if (!parsed.success) {
    throw new Error("Ungültige Änderung.");
  }
  const supabase = await createClient();
  const lead = await getLead(supabase, leadId);
  if (!lead) {
    throw new Error("Lead nicht gefunden.");
  }
  await updateLead(supabase, leadId, lead.customer_id, parsed.data);
  await writeAuditLog(supabase, {
    userId: user.id,
    customerId: lead.customer_id,
    action: "lead.updated",
    entityType: "lead",
    entityId: leadId,
    metadata: parsed.data,
  });
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}
