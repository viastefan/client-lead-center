import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { hasClaudeKey, hasGoogleOAuth, hasMicrosoftOAuth, hasResendKey, isSupabaseAdminConfigured } from "@/lib/env";

export const metadata = { title: "Integrationen" };

export default function IntegrationsPage() {
  const items = [
    { name: "Lead API", status: "operational", note: "POST /api/leads" },
    { name: "Supabase PostgreSQL", status: "operational", note: "Persistenter Speicher" },
    { name: "Supabase Storage", status: isSupabaseAdminConfigured() ? "operational" : "warning", note: "Bucket attachments" },
    { name: "Gmail OAuth", status: hasGoogleOAuth() ? "operational" : "warning", note: "V1 vorbereitet" },
    { name: "Microsoft 365 OAuth", status: hasMicrosoftOAuth() ? "operational" : "warning", note: "V1 vorbereitet" },
    { name: "Resend", status: hasResendKey() ? "operational" : "warning", note: "System-Mails" },
    { name: "Claude", status: hasClaudeKey() ? "operational" : "warning", note: "Analyse-Adapter" },
  ];

  return (
    <>
      <PageHeader title="Integrationen" description="Zentrale Anbindungen. Kundenwebsites bleiben eigene Vercel-Projekte." />
      <Panel title="Status">
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="mt-1 text-sm text-muted">{item.note}</p>
              </div>
              <StatusBadge tone={item.status === "operational" ? "success" : "warning"}>
                {item.status === "operational" ? "Operational" : "Warning"}
              </StatusBadge>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
