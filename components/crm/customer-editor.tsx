"use client";

import { useState } from "react";
import { upsertLocalCustomer } from "@/lib/crm/store";
import { sourceLabel, type DirectoryCustomer, type DirectorySource } from "@/lib/crm/types";

export function CustomerEditor({ customer }: { customer: DirectoryCustomer }) {
  const [form, setForm] = useState(customer);
  const [saved, setSaved] = useState(false);

  function patch<K extends keyof DirectoryCustomer>(key: K, value: DirectoryCustomer[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        upsertLocalCustomer(form);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1400);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Firma" value={form.companyName} onChange={(value) => patch("companyName", value)} />
        <Field label="Ansprechpartner" value={form.contactName} onChange={(value) => patch("contactName", value)} />
        <Field label="E-Mail" value={form.email} onChange={(value) => patch("email", value)} type="email" />
        <Field label="Telefon" value={form.phone} onChange={(value) => patch("phone", value)} />
        <Field label="Domain" value={form.domain} onChange={(value) => patch("domain", value)} />
        <Field label="Website / Wix-URL" value={form.websiteUrl} onChange={(value) => patch("websiteUrl", value)} />
        <label className="block">
          <span className="mb-1.5 block text-xs text-subtle">Quelle</span>
          <select
            className="field"
            value={form.source}
            onChange={(event) => patch("source", event.target.value as DirectorySource)}
          >
            <option value="website">Website</option>
            <option value="wix">Wix</option>
            <option value="manual">Manuell</option>
          </select>
        </label>
        <p className="self-end text-[12px] text-muted">{sourceLabel(form.source)}</p>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs text-subtle">Adresse für Angebot und Rechnung</span>
        <textarea
          className="field h-auto py-2"
          rows={2}
          value={form.address}
          onChange={(event) => patch("address", event.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs text-subtle">Notizen</span>
        <textarea
          className="field h-auto py-2"
          rows={2}
          value={form.notes}
          onChange={(event) => patch("notes", event.target.value)}
        />
      </label>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary">
          {saved ? "Gespeichert" : "Kundendaten speichern"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-subtle">{label}</span>
      <input className="field" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
