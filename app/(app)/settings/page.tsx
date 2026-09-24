import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { CompanySettingsForm } from "@/components/settings/company-form";
import { requireSessionUser } from "@/lib/auth/session";
import { isPreviewMode } from "@/lib/data/workspace";
import { MailboxForm } from "@/components/settings/mailbox-form";
import { WorkspaceBackup } from "@/components/settings/workspace-backup";
import {
  hasClaudeKey,
  hasGoogleOAuth,
  hasIonosSmtp,
  hasMicrosoftOAuth,
  hasResendKey,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/lib/env";

export const metadata = { title: "Einstellungen" };

export default async function SettingsPage() {
  const user = await requireSessionUser();
  const preview = isPreviewMode();

  const checks = [
    { label: "Supabase URL + Anon Key", ok: isSupabaseConfigured() },
    { label: "Service Role Key", ok: isSupabaseAdminConfigured() },
    { label: "Resend", ok: hasResendKey() },
    { label: "1&1 / IONOS SMTP", ok: hasIonosSmtp() },
    { label: "Gmail OAuth", ok: hasGoogleOAuth() },
    { label: "Microsoft OAuth", ok: hasMicrosoftOAuth() },
    { label: "Claude", ok: hasClaudeKey() },
  ];

  return (
    <>
      <PageHeader
        title="Einstellungen"
        description="Firma, Steuer, Bank, Nummernkreise und Designvorlagen. Umgebung getrennt darunter."
      />
      <CompanySettingsForm />
      <div className="mt-8">
        <MailboxForm serverConfigured={hasIonosSmtp()} />
      </div>
      <div className="mt-8">
        <WorkspaceBackup />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Panel title="Konto">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-subtle">E-Mail</dt>
              <dd className="mt-1">{user.email}</dd>
            </div>
            <div>
              <dt className="text-subtle">Rolle</dt>
              <dd className="mt-1">{user.profile?.role ?? "unbekannt"}</dd>
            </div>
            <div>
              <dt className="text-subtle">Speicher</dt>
              <dd className="mt-1">{preview ? "Dieser Browser (lokal)" : "Supabase Postgres"}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Umgebung">
          <ul className="space-y-3">
            {checks.map((item) => (
              <li key={item.label} className="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <StatusBadge tone={item.ok ? "success" : "warning"}>{item.ok ? "OK" : "Offen"}</StatusBadge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <div className="mt-6">
        <Panel title="Sicherheit">
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
            <li>API-Keys werden nur als Hash gespeichert.</li>
            <li>Service-Role-Keys gehören ausschließlich auf den Server.</li>
            <li>Kundenwebsites dürfen den Lead-API-Key nicht im Browser ausliefern.</li>
            <li>Rechnungen in der Vorschau liegen nur auf diesem Gerät, bis die Billing-Migration läuft.</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
