"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBilling } from "@/lib/billing/store";
import { demoCustomers } from "@/lib/demo/workspace";
import { kindHref, kindLabel } from "@/lib/billing/labels";

const ROUTES = [
  { href: "/", label: "Übersicht" },
  { href: "/inbox", label: "Inbox" },
  { href: "/monitor", label: "Überwachung" },
  { href: "/leads", label: "Leads" },
  { href: "/clients", label: "Kunden" },
  { href: "/quotes/new", label: "Neues Angebot" },
  { href: "/invoices/new", label: "Neue Rechnung" },
  { href: "/contracts/new", label: "Neuer Vertrag" },
  { href: "/reminders", label: "Erinnerungen" },
  { href: "/emails", label: "Rundmail" },
  { href: "/emails", label: "E-Mail" },
  { href: "/websites", label: "Websites" },
  { href: "/settings", label: "Einstellungen" },
];

export function CommandPalette() {
  const router = useRouter();
  const { documents, ready } = useBilling();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const customers = demoCustomers();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        setQuery("");
      }
      if (event.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
      setQuery("");
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("clc-cmdk", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("clc-cmdk", onOpen);
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const routes = ROUTES.filter((item) => !q || item.label.toLowerCase().includes(q));
    const docs = ready
      ? documents
          .filter((doc) => `${doc.number} ${doc.customerName}`.toLowerCase().includes(q))
          .slice(0, 6)
          .map((doc) => ({
            href: `${kindHref(doc.kind)}/${doc.id}`,
            label: `${kindLabel(doc.kind)} ${doc.number} · ${doc.customerName}`,
          }))
      : [];
    const people = customers
      .filter((customer) => !q || customer.company_name.toLowerCase().includes(q))
      .slice(0, 5)
      .map((customer) => ({ href: `/clients/${customer.id}`, label: customer.company_name }));
    return [...routes, ...docs, ...people].slice(0, 12);
  }, [customers, documents, query, ready]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[18vh]">
      <button type="button" className="absolute inset-0" aria-label="Schließen" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-lg border border-border bg-[#141416] shadow-2xl">
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && results[0]) {
              setOpen(false);
              router.push(results[0].href);
            }
          }}
          placeholder="Gehe zu, suche Dokumente…"
          className="h-11 w-full border-b border-border bg-transparent px-4 text-[13px] outline-none"
        />
        <ul className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 ? (
            <li className="px-4 py-3 text-[13px] text-muted">Nichts gefunden</li>
          ) : (
            results.map((item, index) => (
              <li key={item.href + item.label}>
                <button
                  type="button"
                  className={`row w-full rounded-none text-left text-[13px] ${index === 0 ? "bg-white/[0.04]" : ""}`}
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
