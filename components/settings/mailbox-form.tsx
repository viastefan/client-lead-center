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
  const [port, setPort] = useState<number>(IONOS_DEFAULTS.port);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const workingUser = touched ? username : (stored.username ?? "stefandirnberger@viawen.com");
  const workingHost = touched ? host : (stored.host ?? IONOS_DEFAULTS.host);
  const workingPort = touched ? port : (stored.port ?? IONOS_DEFAULTS.port);

  async function run(method: "PUT" | "POST") {
    setBusy(true);
    writeMailboxClient({ username: workingUser, host: workingHost, port: workingPort, password });
    const body =
      method === "PUT"
        ? mailboxPayload({ fromName: "Stefan Dirnberger" })
        : mailboxPayload({
            to: workingUser,
            subject: "Test von Stefan Dirnberger",
            text: "SMTP-Test. Wenn diese Mail ankommt, ist das Webmail-Postfach verbunden.",
            fromName: "Stefan Dirnberger",
          });
    const response = await fetch("/api/mail", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { success?: boolean; error?: { message?: string } };
    setStatus(
      payload.success
        ? method === "PUT"
          ? "Verbindung ok — Rechnungen können über dieses Postfach raus."
          : "Testmail gesendet. Posteingang prüfen."
        : payload.error?.message || "Fehler",
    );
    setBusy(false);
  }

  return (
    <Panel
      title="1&1 / IONOS Webmail"
      description="Versand über smtp.ionos.de. Passwort ist das Webmail-Passwort der Adresse — nicht der API-Schlüssel aus dem IONOS Entwicklerportal."
    >
      {serverConfigured ? (
        <p className="mb-3 text-[13px] text-muted">Server-Postfach ist über IONOS_SMTP_* verbunden.</p>
      ) : null}
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
        <label className="block">
          <span className="mb-1.5 block text-xs text-subtle">Port</span>
          <select
            className="field"
            value={workingPort}
            onChange={(event) => {
              setTouched(true);
              setPort(Number(event.target.value));
            }}
          >
            <option value={465}>465 · SSL</option>
            <option value={587}>587 · STARTTLS</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-subtle">Webmail-Passwort (nur diese Sitzung)</span>
          <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" disabled={busy} onClick={() => void run("PUT")}>
          Verbindung testen
        </button>
        <button type="button" className="btn-primary" disabled={busy} onClick={() => void run("POST")}>
          Testmail an mich
        </button>
      </div>
      {status ? <p className="mt-3 text-[13px] text-muted">{status}</p> : null}
    </Panel>
  );
}
