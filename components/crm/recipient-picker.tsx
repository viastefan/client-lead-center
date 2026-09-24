"use client";

import { useMemo, useState } from "react";
import { findDirectoryCustomer, searchDirectory } from "@/lib/crm/directory";
import { useDirectory } from "@/lib/crm/use-directory";
import { sourceLabel, type DirectoryCustomer } from "@/lib/crm/types";

export function RecipientPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (customer: DirectoryCustomer | null) => void;
}) {
  const customers = useDirectory();
  const selected = findDirectoryCustomer(customers, value);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const hits = useMemo(() => searchDirectory(customers, query).slice(0, 12), [customers, query]);

  return (
    <div className="relative sm:col-span-2">
      <span className="mb-1.5 block text-xs text-subtle">Empfänger</span>
      <button
        type="button"
        className="field flex h-auto min-h-10 items-center justify-between gap-3 py-2 text-left"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="min-w-0">
          {selected ? (
            <>
              <span className="block truncate text-[13px] font-medium">{selected.companyName}</span>
              <span className="block truncate text-[11px] text-muted">
                {selected.email} · {sourceLabel(selected.source)}
              </span>
            </>
          ) : (
            <span className="text-subtle">Kunde aus der Datenbank wählen</span>
          )}
        </span>
        <span className="text-[11px] text-subtle">{open ? "Schließen" : "Suchen"}</span>
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-[#141416] shadow-2xl">
          <input
            autoFocus
            className="h-10 w-full border-b border-border bg-transparent px-3 text-[13px] outline-none placeholder:text-subtle"
            placeholder="Firma, E-Mail, Domain, Wix…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ul className="max-h-64 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                className="flex w-full px-3 py-2 text-left text-[13px] text-muted hover:bg-white/5"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                  setQuery("");
                }}
              >
                Ohne Zuordnung — Empfänger selbst eintragen
              </button>
            </li>
            {hits.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  className="flex w-full flex-col px-3 py-2 text-left hover:bg-white/5"
                  onClick={() => {
                    onChange(customer);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span className="text-[13px] font-medium">{customer.companyName}</span>
                  <span className="text-[11px] text-muted">
                    {customer.contactName} · {customer.email} · {sourceLabel(customer.source)}
                  </span>
                </button>
              </li>
            ))}
            {hits.length === 0 ? (
              <li className="px-3 py-3 text-[12px] text-muted">Kein Treffer. Unter Kunden einen Wix- oder Website-Kontakt anlegen.</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
