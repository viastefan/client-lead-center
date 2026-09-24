"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sourceFromForm, upsertLocalCustomer } from "@/lib/crm/store";
import type { DirectorySource } from "@/lib/crm/types";

export function CreateCustomerForm() {
  const router = useRouter();
  const [source, setSource] = useState<DirectorySource>("wix");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="max-w-xl space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const companyName = String(data.get("companyName") || "").trim();
        const email = String(data.get("contactEmail") || "").trim();
        if (!companyName || !email) {
          setError("Firma und E-Mail sind Pflicht.");
          return;
        }
        setPending(true);
        const saved = upsertLocalCustomer({
          companyName,
          contactName: String(data.get("contactName") || companyName).trim(),
          email,
          phone: String(data.get("contactPhone") || "").trim(),
          address: String(data.get("address") || "").trim(),
          domain: String(data.get("domain") || "").trim(),
          source: sourceFromForm(String(data.get("source") || source)),
          notes: String(data.get("notes") || "").trim(),
        });
        router.push(`/clients/${saved.id}`);
        router.refresh();
      }}
    >
      <label className="block">
        <span className="mb-2 block text-sm text-muted">Quelle</span>
        <select
          name="source"
          className="field"
          value={source}
          onChange={(event) => setSource(event.target.value as DirectorySource)}
        >
          <option value="wix">Wix</option>
          <option value="website">Website</option>
          <option value="manual">Manuell</option>
        </select>
      </label>
      <Field name="companyName" label="Firma" required />
      <Field name="contactName" label="Ansprechpartner" required />
      <Field name="contactEmail" label="E-Mail (Empfänger)" type="email" required />
      <Field name="contactPhone" label="Telefon" />
      <Field name="domain" label={source === "wix" ? "Wix-Domain oder URL" : "Website-Domain"} />
      <Field name="address" label="Adresse (für Angebot & Rechnung)" />
      <label className="block">
        <span className="mb-2 block text-sm text-muted">Notizen</span>
        <textarea name="notes" rows={3} className="field h-auto py-2" />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Speichern…" : "In Kundendatenbank legen"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-muted">{label}</span>
      <input name={name} type={type} required={required} className="field" />
    </label>
  );
}
