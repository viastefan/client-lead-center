"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EntityMark } from "@/components/entity-mark";
import { EmptyState, StatusBadge } from "@/components/ui";
import { searchDirectory } from "@/lib/crm/directory";
import { useDirectory } from "@/lib/crm/use-directory";
import { sourceLabel, type DirectoryCustomer } from "@/lib/crm/types";

export function CustomerBoard({ serverCustomers = [] }: { serverCustomers?: DirectoryCustomer[] }) {
  const customers = useDirectory(serverCustomers);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => searchDirectory(customers, query), [customers, query]);

  return (
    <>
      <div className="mb-4 rounded-md border border-border px-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Firma, E-Mail, Website, Wix"
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
          {rows.map((customer) => (
            <li key={customer.id}>
              <div className="row rounded-none">
                <Link href={`/clients/${customer.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <EntityMark name={customer.companyName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{customer.companyName}</p>
                    <p className="truncate text-[12px] text-muted">
                      {customer.contactName} · {customer.email}
                    </p>
                  </div>
                  <p className="hidden max-w-[180px] truncate text-[12px] text-muted sm:block">{customer.domain}</p>
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
