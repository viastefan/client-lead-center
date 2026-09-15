"use client";

import { FormEvent, useState } from "react";
import { company } from "@/lib/company";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";

export function InquiryForm({
  subject,
  intent,
}: {
  subject: string;
  intent: string;
}) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!privacy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      first: String(data.get("first") ?? ""),
      last: String(data.get("last") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      org: String(data.get("org") ?? ""),
      message: String(data.get("message") ?? ""),
      subject,
      intent,
    };

    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setSent(true);
        return;
      }
      const composed = [
        intent,
        "",
        `Name: ${payload.first} ${payload.last}`,
        `E-Mail: ${payload.email}`,
        payload.phone ? `Telefon: ${payload.phone}` : "",
        payload.org ? `Organisation: ${payload.org}` : "",
        "",
        payload.message,
      ]
        .filter(Boolean)
        .join("\n");
      window.location.href = `mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(composed)}`;
      setSent(true);
    } catch {
      setError("Senden fehlgeschlagen. Bitte E-Mail direkt nutzen.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-[28px] border border-line bg-white/80 p-7 backdrop-blur-sm">
        <h2 className="text-xl tracking-tight">Anfrage unterwegs</h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          Danke. Wir melden uns. Alternativ: {company.email} oder {company.phone}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-[28px] border border-line bg-white/70 p-6 backdrop-blur-sm sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Vorname" htmlFor={`${intent}-first`}>
          <Input id={`${intent}-first`} name="first" required autoComplete="given-name" />
        </Field>
        <Field label="Nachname" htmlFor={`${intent}-last`}>
          <Input id={`${intent}-last`} name="last" required autoComplete="family-name" />
        </Field>
      </div>
      <Field label="E-Mail" htmlFor={`${intent}-email`}>
        <Input id={`${intent}-email`} name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Telefon" htmlFor={`${intent}-phone`}>
        <Input id={`${intent}-phone`} name="phone" type="tel" autoComplete="tel" />
      </Field>
      <Field label="Unternehmen / Verein" htmlFor={`${intent}-org`}>
        <Input id={`${intent}-org`} name="org" autoComplete="organization" />
      </Field>
      <Field label="Nachricht" htmlFor={`${intent}-message`}>
        <Textarea id={`${intent}-message`} name="message" required />
      </Field>
      <label className="flex items-start gap-3 text-sm text-muted">
        <input
          type="checkbox"
          className="mt-1"
          checked={privacy}
          onChange={(event) => setPrivacy(event.target.checked)}
          required
        />
        <span>
          Ich habe die{" "}
          <a className="underline" href="/datenschutz">
            Datenschutzerklärung
          </a>{" "}
          zur Kenntnis genommen.
        </span>
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Senden…" : "Anfrage senden"}
      </Button>
    </form>
  );
}
