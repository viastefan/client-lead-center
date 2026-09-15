import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { listEmailAccounts } from "@/lib/services/websites";
import { emailStatusLabel } from "@/lib/format";

export const metadata = { title: "E-Mails" };

export default async function EmailsPage() {
  const supabase = await createClient();
  const accounts = await listEmailAccounts(supabase);

  return (
    <>
      <PageHeader
        title="E-Mails"
        description="Kunden-Mailboxen werden später per OAuth (Gmail / Microsoft 365) verbunden. Passwörter werden nicht gespeichert."
      />
      <Panel title="Verbindungen">
        {accounts.length === 0 ? (
          <p className="text-sm text-muted">Keine E-Mail-Konten vorhanden.</p>
        ) : (
          <ul className="divide-y divide-border">
            {accounts.map((account) => (
              <li key={account.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{account.email}</p>
                  <p className="mt-1 text-sm text-muted">
                    {account.customer?.company_name ?? "Kunde"} · {account.provider}
                  </p>
                </div>
                <StatusBadge tone={account.status === "connected" ? "success" : account.status === "error" ? "danger" : "neutral"}>
                  {emailStatusLabel(account.status)}
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <p className="mt-4 text-sm text-muted">
        System-Benachrichtigungen (Resend) sind von Kunden-Mailboxen getrennt und folgen in einer späteren Phase.
      </p>
    </>
  );
}
