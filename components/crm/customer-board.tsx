"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EntityMark } from "@/components/entity-mark";
import { EmptyState, StatusBadge } from "@/components/ui";
import { customerLedger } from "@/lib/billing/customer-finance";
import { formatMoney } from "@/lib/billing/format";
import { useBilling } from "@/lib/billing/store";
import { searchDirectory } from "@/lib/crm/directory";
import { useDirectory } from "@/lib/crm/use-directory";
import { sourceLabel, type DirectoryCustomer, type DirectorySource } from "@/lib/crm/types";

const SOURCE_FILTERS: Array<{ id: "all" | DirectorySource; label: string }> = [
  { id: "all", label: "Alle" },
  { id: "website", label: "Website" },
  { id: "wix", label: "Wix" },
  { id: "manual", label: "Manuell" },
];

export function CustomerBoard({ serverCustomers = [] }: { serverCustomers?: DirectoryCustomer[] }) {
  const customers = useDirectory(serverCustomers);
  const { documents, ready } = useBilling();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<(typeof SOURCE_FILTERS)[number]["id"]>("all");
  const [sort, setSort] = useState<"name" | "open">("name");
  const rows = useMemo(() => {
    const found = searchDirectory(customers, query).filter((customer) => source === "all" || customer.source === source);
    const withLedger = found.map((customer) => ({
      customer,
      ledger: ready ? customerLedger(documents, customer.id) : null,
    }));
    if (sort === "open") {
      withLedger.sort((a, b) => (b.ledger?.openAmount ?? 0) - (a.ledger?.openAmount ?? 0));
    }
    return withLedger;
  }, [customers, documents, query, ready, sort, source]);

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {SOURCE_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSource(item.id)}
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              source === item.id ? "border-white/25 bg-white/10 text-foreground" : "border-border text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSort(sort === "name" ? "open" : "name")}
          className="ml-auto rounded-full border border-border px-2.5 py-1 text-[11px] text-muted"
        >
          {sort === "open" ? "Nach offenem Betrag" : "A–Z"}
        </button>
      </div>
      <div className="mb-4 rounded-md border border-border px-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Firma, E-Mail, Website, Wix, USt-IdNr."
          className="h-10 w-full bg-transparent text-[13px] outline-none placeholder:text-subtle"
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState
          title="Keine Kunden"
          description="Website-Mandanten stehen automatisch in der Datenbank. Wix-Shops und weitere Empfänger legen Sie manuell an."
          action={
            <Link href="/clients/new" className="btn-primary">
              Empfänger anlegen
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {rows.map(({ customer, ledger }) => (
            <li key={customer.id}>
              <div className="row rounded-none">
                <Link href={`/clients/${customer.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <EntityMark name={customer.companyName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{customer.companyName}</p>
                    <p className="truncate text-[12px] text-muted">
                      {customer.contactName} · {customer.email || customer.phone || "ohne Mail"}
                    </p>
                  </div>
                  <p className="hidden max-w-[180px] truncate text-[12px] text-muted sm:block">{customer.domain}</p>
                  <p className="hidden w-20 text-right text-[12px] tabular-nums text-muted sm:block">
                    {ledger ? formatMoney(ledger.openAmount) : ""}
                  </p>
                  <StatusBadge>{sourceLabel(customer.source)}</StatusBadge>
                </Link>
                <Link href={`/quotes/new?customer=${customer.id}`} className="btn-ghost shrink-0">
                  Angebot
                </Link>
                <Link href={`/invoices/new?customer=${customer.id}`} className="btn-ghost hidden shrink-0 sm:inline-flex">
                  Rechnung
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
