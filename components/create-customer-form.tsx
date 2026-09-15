"use client";

import { useActionState } from "react";
import { createCustomerAction, type ActionState } from "@/lib/actions";

const initial: ActionState = {};

export function CreateCustomerForm() {
  const [state, action, pending] = useActionState(createCustomerAction, initial);

  return (
    <form action={action} className="max-w-xl space-y-5">
      <Field name="companyName" label="Firmenname" required />
      <Field name="name" label="Kurzname" required />
      <Field name="contactName" label="Ansprechpartner" required />
      <Field name="contactEmail" label="E-Mail" type="email" required />
      <Field name="contactPhone" label="Telefon" />
      <label className="block">
        <span className="mb-2 block text-sm text-muted">Notizen</span>
        <textarea
          name="notes"
          rows={4}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 outline-none ring-foreground/10 focus:ring-2"
        />
      </label>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-lg bg-accent px-4 text-sm text-white disabled:opacity-60"
      >
        {pending ? "Speichern…" : "Kunde anlegen"}
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
      <input
        name={name}
        type={type}
        required={required}
        className="h-11 w-full rounded-lg border border-border bg-card px-3 outline-none ring-foreground/10 focus:ring-2"
      />
    </label>
  );
}
