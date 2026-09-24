"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { DocumentList } from "@/components/billing/document-list";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { findDirectoryCustomer } from "@/lib/crm/directory";
import { useDirectory } from "@/lib/crm/use-directory";
import { sourceLabel } from "@/lib/crm/types";

function subscribeReady(onStoreChange: () => void) {
  queueMicrotask(onStoreChange);
  return () => undefined;
}

export function LocalCustomerFallback({ id }: { id: string }) {
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);
  const customers = useDirectory();
  const customer = useMemo(() => findDirectoryCustomer(customers, id), [customers, id]);

  if (!ready) return <div className="glass h-40 animate-pulse rounded-lg" />;
  if (!customer) {
    return (
      <EmptyState
        title="Kunde nicht gefunden"
        description="Dieser Empfänger liegt nicht in der lokalen Kundendatenbank."
        action={
          <Link href="/clients" className="btn-primary">
            Zur Datenbank
          </Link>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title={customer.companyName}
        description={`${customer.contactName} · ${customer.email}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/quotes/new?customer=${customer.id}`} className="btn-ghost">
              Angebot
            </Link>
            <Link href={`/invoices/new?customer=${customer.id}`} className="btn-ghost">
              Rechnung
            </Link>
            <Link href={`/contracts/new?customer=${customer.id}`} className="btn-ghost">
              Vertrag
            </Link>
            <StatusBadge>{sourceLabel(customer.source)}</StatusBadge>
          </div>
        }
      />
      <Panel title="Empfänger" description="Eintrag aus der lokalen Kundendatenbank (Website, Wix oder manuell).">
        <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
          <div>
            <dt className="text-xs text-subtle">Domain</dt>
            <dd>{customer.domain || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Telefon</dt>
            <dd>{customer.phone || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-subtle">Adresse</dt>
            <dd className="whitespace-pre-wrap">{customer.address || "—"}</dd>
          </div>
        </dl>
      </Panel>
      <div className="mt-6">
        <Panel title="Dokumente">
          <DocumentList customerId={customer.id} />
        </Panel>
      </div>
    </>
  );
}
