"use client";

import { useState, useSyncExternalStore } from "react";
import { Panel } from "@/components/ui";
import { IONOS_DEFAULTS } from "@/lib/email/ionos-config";
import { mailboxPayload, readMailboxClient, writeMailboxClient } from "@/lib/email/mailbox-client";

function subscribeHydration(onStoreChange: () => void) {
  queueMicrotask(onStoreChange);
  return () => undefined;
}

export function MailboxForm({ serverConfigured = false }: { serverConfigured?: boolean }) {
  const ready = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const stored = ready ? readMailboxClient() : {};
  const [username, setUsername] = useState("");
  const [host, setHost] = useState<string>(IONOS_DEFAULTS.host);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [touched, setTouched] = useState(false);

  const workingUser = touched ? username : (stored.username ?? "");
  const workingHost = touched ? host : (stored.host ?? IONOS_DEFAULTS.host);

  async function run(method: "PUT" | "POST", extra?: { to?: string; subject?: string; text?: string }) {
    writeMailboxClient({ username: workingUser, host: workingHost, password });
    const body =
      method === "PUT"
        ? mailboxPayload()
        : mailboxPayload({
            to: extra?.to ?? workingUser,
            subject: extra?.subject ?? "Client Lead Center Test",
            text: extra?.text ?? "SMTP-Test von Client Lead Center.",
          });
    const response = await fetch("/api/mail", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { success?: boolean; error?: { message?: string } };
    setStatus(payload.success ? (method === "PUT" ? "Verbindung ok" : "Test gesendet") : payload.error?.message || "Fehler");
  }

  return (
    <Panel
      title="1&1 / IONOS Webmail"
      description="SMTP smtp.ionos.de:465. Passwort nur in dieser Sitzung, nie in NEXT_PUBLIC."
    >
      {serverConfigured ? (
        <p className="mb-3 text-[13px] text-muted">Server-Postfach ist über IONOS_SMTP_* verbunden.</p>
      ) : (
        <p className="mb-3 text-[13px] text-muted">
          Benutzername und Passwort des 1&1-Postfachs eintragen, dann Verbindung testen. Danach gehen Rundmails und Dokumente raus.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs text-subtle">E-Mail</span>
          <input
            className="field"
            type="email"
            value={workingUser}
            onChange={(event) => {
              setTouched(true);
              setUsername(event.target.value);
            }}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-subtle">SMTP-Host</span>
          <input
            className="field"
            value={workingHost}
            onChange={(event) => {
              setTouched(true);
              setHost(event.target.value);
            }}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs text-subtle">Passwort (nur diese Sitzung)</span>
          <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" onClick={() => void run("PUT")}>
          Verbindung testen
        </button>
        <button type="button" className="btn-primary" onClick={() => void run("POST")}>
          Testmail an mich
        </button>
      </div>
      {status ? <p className="mt-3 text-[13px] text-muted">{status}</p> : null}
    </Panel>
  );
}
