"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { appendBroadcastLog, EMPTY_BROADCAST_LOG, readBroadcastLogFromStorage, subscribeBroadcastLog } from "@/lib/email/broadcast-log";
import { mailboxPayload } from "@/lib/email/mailbox-client";
import { BROADCAST_TEMPLATES, renderMailPlaceholders, templateById } from "@/lib/email/templates";
import type { BroadcastRecipient } from "@/lib/email/recipients";
import { logOpsEvent } from "@/lib/ops/events";

function formatStamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function BroadcastBoard({
  recipients,
  presetId,
}: {
  recipients: BroadcastRecipient[];
  presetId?: string;
}) {
  const first = templateById("status");
  const [templateId, setTemplateId] = useState("status");
  const [subject, setSubject] = useState(first.subject);
  const [text, setText] = useState(first.text);
  const [selected, setSelected] = useState<string[]>(() =>
    presetId && recipients.some((item) => item.id === presetId)
      ? [presetId]
      : recipients.map((item) => item.id),
  );
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; text: string; email: string } | null>(null);
  const [confirmLive, setConfirmLive] = useState(false);
  const log = useSyncExternalStore(subscribeBroadcastLog, readBroadcastLogFromStorage, () => EMPTY_BROADCAST_LOG);

  const chosen = useMemo(
    () => recipients.filter((item) => selected.includes(item.id)),
    [recipients, selected],
  );

  function applyTemplate(id: string) {
    const template = templateById(id);
    setTemplateId(id);
    setSubject(template.subject);
    setText(template.text);
    setPreview(null);
  }

  async function run(dryRun: boolean) {
    if (chosen.length === 0) {
      setStatus("Keine Empfänger.");
      return;
    }
    if (!dryRun && !confirmLive) {
      setStatus("Bitte bestätigen, dass echte Adressen geschrieben werden.");
      return;
    }
    setBusy(true);
    setStatus(dryRun ? "Vorschau…" : "Sende…");
    try {
      const response = await fetch("/api/mail/broadcast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mailboxPayload({
            dryRun,
            subject,
            text,
            recipients: chosen,
          }),
        ),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: { message?: string };
        sent?: number;
        total?: number;
        failed?: Array<{ email: string }>;
        rendered?: Array<{ email: string; subject: string; text: string }>;
      };
      if (!response.ok) {
        setStatus(payload.error?.message || "Fehler");
        return;
      }
      const sample = payload.rendered?.[0];
      if (sample) setPreview({ email: sample.email, subject: sample.subject, text: sample.text });
      appendBroadcastLog({
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        subject,
        dryRun,
        sent: payload.sent ?? 0,
        failed: payload.failed?.length ?? 0,
        total: payload.total ?? chosen.length,
      });
      logOpsEvent({
        title: dryRun
          ? `Rundmail-Vorschau · ${chosen.length}`
          : `Rundmail ${payload.sent}/${payload.total} gesendet`,
        href: "/emails",
      });
      setStatus(
        dryRun
          ? `Vorschau für ${payload.total} Empfänger`
          : `${payload.sent}/${payload.total} gesendet${payload.failed?.length ? `, ${payload.failed.length} Fehler` : ""}`,
      );
      if (!dryRun) setConfirmLive(false);
    } catch {
      setStatus("Netzwerkfehler");
    } finally {
      setBusy(false);
    }
  }

  const sampleRecipient = chosen[0];
  const livePreview = sampleRecipient
    ? {
        subject: renderMailPlaceholders(subject, sampleRecipient),
        text: renderMailPlaceholders(text, sampleRecipient),
      }
    : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="overflow-hidden rounded-lg border border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-[13px] font-medium">Rundmail</p>
            <p className="mt-0.5 text-[12px] text-muted">Eine Vorlage, einzeln an jeden Kunden. Kein offenes BCC.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => void run(true)}>
              Vorschau
            </button>
            <button type="button" className="btn-primary" disabled={busy || !confirmLive} onClick={() => void run(false)}>
              {busy ? "Sende…" : `Senden (${chosen.length})`}
            </button>
          </div>
        </div>
        <div className="space-y-4 px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {BROADCAST_TEMPLATES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`h-8 rounded-md border px-3 text-[12px] ${
                  templateId === item.id ? "border-accent bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]" : "border-border text-muted"
                }`}
                onClick={() => applyTemplate(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs text-subtle">Betreff</span>
            <input className="field" value={subject} onChange={(event) => setSubject(event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-subtle">Text · {"{company} {contact} {email} {domain}"}</span>
            <textarea
              className="min-h-36 w-full rounded-md border border-border bg-[#0c0c0d] px-3 py-2 text-[13px] outline-none"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-[13px] text-muted">
            <input
              type="checkbox"
              checked={confirmLive}
              onChange={(event) => setConfirmLive(event.target.checked)}
            />
            An {chosen.length} echte Adressen senden
          </label>
          {status ? <p className="text-[13px] text-muted">{status}</p> : null}
          {livePreview ? (
            <div className="rounded-md border border-border px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-subtle">Erste Mail</p>
              <p className="mt-2 text-[13px] font-medium">{livePreview.subject}</p>
              <pre className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-muted">{livePreview.text}</pre>
            </div>
          ) : null}
          {preview && preview.email !== sampleRecipient?.email ? (
            <p className="text-[12px] text-subtle">Server-Vorschau: {preview.email}</p>
          ) : null}
        </div>
      </section>

      <div className="space-y-6">
        <section className="overflow-hidden rounded-lg border border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-[13px] font-medium">Empfänger</p>
            <div className="flex gap-2">
              <button type="button" className="text-[12px] text-muted hover:text-foreground" onClick={() => setSelected(recipients.map((item) => item.id))}>
                Alle
              </button>
              <button type="button" className="text-[12px] text-muted hover:text-foreground" onClick={() => setSelected([])}>
                Keine
              </button>
            </div>
          </div>
          <ul>
            {recipients.length === 0 ? (
              <li className="px-4 py-8 text-[13px] text-muted">Keine aktiven Kunden mit E-Mail.</li>
            ) : (
              recipients.map((item) => {
              const on = selected.includes(item.id);
              return (
                <li key={item.id} className="border-b border-border last:border-0">
                  <label className="row cursor-pointer rounded-none">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setSelected((current) =>
                          on ? current.filter((id) => id !== item.id) : [...current, item.id],
                        )
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px]">{item.company}</span>
                      <span className="block truncate text-[12px] text-muted">{item.email}</span>
                    </span>
                  </label>
                </li>
              );
            })
            )}
          </ul>
        </section>

        <section className="overflow-hidden rounded-lg border border-border">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[13px] font-medium">Gesendet</p>
          </div>
          {log.length === 0 ? (
            <p className="px-4 py-5 text-[13px] text-muted">Noch keine Rundmail in diesem Browser.</p>
          ) : (
            <ul>
              {log.slice(0, 8).map((item) => (
                <li key={item.id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0 text-[13px]">
                  <span className="min-w-0 flex-1 truncate">{item.subject || "Ohne Betreff"}</span>
                  <span className="text-[12px] text-subtle">
                    {item.dryRun ? "Vorschau" : `${item.sent}/${item.total}`}
                  </span>
                  <span className="hidden text-[12px] text-subtle sm:block">{formatStamp(item.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
