"use client";

import { useState, useSyncExternalStore } from "react";
import { Panel } from "@/components/ui";
import { IONOS_DEFAULTS } from "@/lib/email/ionos-config";

const USER_KEY = "clc.mailbox.user";
const HOST_KEY = "clc.mailbox.host";
const PASS_KEY = "clc.mail.pass";

function subscribeHydration() {
  return () => undefined;
}

export function MailboxForm({ serverConfigured = false }: { serverConfigured?: boolean }) {
  const ready = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const [username, setUsername] = useState("");
  const [host, setHost] = useState<string>(IONOS_DEFAULTS.host);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [touched, setTouched] = useState(false);

  const workingUser = touched || !ready ? username : (window.localStorage.getItem(USER_KEY) ?? "");
  const workingHost =
    touched || !ready ? host : (window.localStorage.getItem(HOST_KEY) ?? IONOS_DEFAULTS.host);

  async function run(method: "PUT" | "POST", extra?: { to?: string; subject?: string; text?: string }) {
    window.localStorage.setItem(USER_KEY, workingUser);
    window.localStorage.setItem(HOST_KEY, workingHost);
    if (password) window.sessionStorage.setItem(PASS_KEY, password);
    const sessionPass = password || window.sessionStorage.getItem(PASS_KEY) || "";
    const body =
      method === "PUT"
        ? { host: workingHost, port: 465, username: workingUser || undefined, password: sessionPass || undefined }
        : {
            to: extra?.to ?? workingUser,
            subject: extra?.subject ?? "Client Lead Center Test",
            text: extra?.text ?? "SMTP-Test von Client Lead Center.",
            host: workingHost,
            port: 465,
            username: workingUser || undefined,
            password: sessionPass || undefined,
          };
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
        <p className="mb-3 text-sm text-muted">Server-Postfach ist über IONOS_SMTP_* verbunden.</p>
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
      {status ? <p className="mt-3 text-sm text-muted">{status}</p> : null}
    </Panel>
  );
}
