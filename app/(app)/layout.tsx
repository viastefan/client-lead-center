import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BillingProvider } from "@/lib/billing/store";
import { loadLeads, isPreviewMode, previewUser } from "@/lib/data/workspace";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const preview = isPreviewMode();
  const user = preview ? previewUser() : await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  const leads = await loadLeads();
  const leadInbox = leads.filter((lead) => lead.status === "new" || lead.status === "in_progress").length;

  return (
    <BillingProvider>
      <AppShell user={user} preview={preview} leadInbox={leadInbox}>
        {children}
      </AppShell>
    </BillingProvider>
  );
}
