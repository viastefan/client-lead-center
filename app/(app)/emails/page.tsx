import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { MailboxForm } from "@/components/settings/mailbox-form";
import { loadEmailAccounts } from "@/lib/data/workspace";
import { hasIonosSmtp } from "@/lib/env";
import { emailStatusLabel } from "@/lib/format";

export const metadata = { title: "E-Mails" };

export default async function EmailsPage() {
  const accounts = await loadEmailAccounts();
  const ionos = hasIonosSmtp();

  return (
    <>
      <PageHeader
        title="E-Mail"
        description="1&1/IONOS Webmail per SMTP. OAuth für Gmail und Microsoft bleibt vorbereitet."
      />
      <MailboxForm serverConfigured={ionos} />
      <div className="mt-6">
        <Panel title="Kunden-Mailboxen">
          {accounts.length === 0 ? (
            <p className="text-sm text-muted">
              Keine OAuth-Konten. Kundenpostfächer folgen, sobald Gmail oder Microsoft verbunden ist.
            </p>
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
                  <StatusBadge
                    tone={account.status === "connected" ? "success" : account.status === "error" ? "danger" : "neutral"}
                  >
                    {emailStatusLabel(account.status)}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
