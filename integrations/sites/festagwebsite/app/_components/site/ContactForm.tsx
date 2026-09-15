"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
          topic: form.get("topic"),
        }),
      });
      if (!response.ok) {
        setError("Konnte nicht gesendet werden. Nutze in der Zwischenzeit die Mail-Links.");
        return;
      }
      setSent(true);
    } catch {
      setError("Konnte nicht gesendet werden. Nutze in der Zwischenzeit die Mail-Links.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return <p className="page-body">Danke — wir melden uns.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="tile" style={{ marginTop: 40 }}>
      <label className="block">
        <span>Name</span>
        <input name="name" required className="mt-2 w-full" />
      </label>
      <label className="block" style={{ marginTop: 16 }}>
        <span>E-Mail</span>
        <input name="email" type="email" required className="mt-2 w-full" />
      </label>
      <label className="block" style={{ marginTop: 16 }}>
        <span>Thema</span>
        <select name="topic" className="mt-2 w-full">
          <option>Sales & Demos</option>
          <option>Support</option>
          <option>Careers</option>
          <option>Security</option>
        </select>
      </label>
      <label className="block" style={{ marginTop: 16 }}>
        <span>Nachricht</span>
        <textarea name="message" required rows={5} className="mt-2 w-full" />
      </label>
      {error ? <p className="page-body" style={{ marginTop: 12 }}>{error}</p> : null}
      <button type="submit" className="btn btn-solid" style={{ marginTop: 20 }} disabled={pending}>
        {pending ? "Senden…" : "Nachricht senden"}
      </button>
    </form>
  );
}
