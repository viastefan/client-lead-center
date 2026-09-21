import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { MailboxForm } from "@/components/settings/mailbox-form";
import { BroadcastBoard } from "@/components/ops/broadcast-board";
import { collectBroadcastRecipients } from "@/lib/email/recipients";
import { loadCustomers, loadEmailAccounts, loadWebsites } from "@/lib/data/workspace";
import { hasIonosSmtp } from "@/lib/env";
import { emailStatusLabel } from "@/lib/format";

export const metadata = { title: "E-Mail" };

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const { customer: presetId } = await searchParams;
  const [accounts, customers, websites] = await Promise.all([
    loadEmailAccounts(),
    loadCustomers(),
    loadWebsites(),
  ]);
  const ionos = hasIonosSmtp();
  const recipients = collectBroadcastRecipients(customers, websites);

  return (
    <>
      <PageHeader
        title="E-Mail"
        description="Postfach verbinden, dann Rundmails an alle Kunden. Jede Adresse einzeln über die Mail-API."
      />
      <BroadcastBoard recipients={recipients} presetId={presetId} />
      <div className="mt-6">
        <MailboxForm serverConfigured={ionos} />
      </div>
      <div className="mt-6">
        <Panel title="Kunden-Mailboxen">
          {accounts.length === 0 ? (
            <p className="text-[13px] text-muted">
              Keine OAuth-Konten. Rundmails gehen über IONOS SMTP, nicht über Gmail/Microsoft.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {accounts.map((account) => (
                <li key={account.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-[13px] font-medium">{account.email}</p>
                    <p className="mt-1 text-[12px] text-muted">
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
