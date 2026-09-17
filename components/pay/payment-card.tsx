"use client";

import { useEffect, useState } from "react";
import { STORAGE_KEY } from "@/lib/billing/defaults";
import { formatLongDate, formatMoney } from "@/lib/billing/format";
import { paypalHref, snapshotFromBillingJson, type PaymentSnapshot } from "@/lib/billing/payment";

export function PaymentCard({
  token,
  snapshot,
}: {
  token: string;
  snapshot: PaymentSnapshot | null;
}) {
  const [local, setLocal] = useState<PaymentSnapshot | null>(null);
  const [hydrated, setHydrated] = useState(Boolean(snapshot));

  useEffect(() => {
    if (snapshot) {
      setHydrated(true);
      return;
    }
    setLocal(snapshotFromBillingJson(window.localStorage.getItem(STORAGE_KEY), token));
    setHydrated(true);
  }, [snapshot, token]);

  const resolved = snapshot ?? local;
  const [copied, setCopied] = useState("");

  async function copy(label: string, value: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1400);
  }

  if (!hydrated) {
    return <section className="glass h-64 animate-pulse rounded-lg" />;
  }

  if (!resolved) {
    return (
      <section className="glass rounded-lg px-5 py-8">
        <h1 className="text-xl font-semibold tracking-tight">Zahlung nicht gefunden</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Dieser Link ist unvollständig. Bitte den vollständigen Zahlungslink aus der Rechnung öffnen.
        </p>
      </section>
    );
  }

  const paypal = paypalHref(resolved.paypalUrl, resolved.amount, resolved.number);

  return (
    <section className="glass rounded-lg">
      <div className="border-b border-border px-5 py-4">
        <p className="kicker">Rechnung</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{resolved.number}</h1>
        <p className="mt-1 text-sm text-muted">{resolved.customerName || resolved.legalName}</p>
      </div>
      <div className="px-5 py-5">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {formatMoney(resolved.amount, resolved.currency)}
        </p>
        <p className="mt-1 text-sm text-muted">Fällig {formatLongDate(resolved.dueDate)}</p>
        {resolved.note ? <p className="mt-4 text-sm leading-6 text-muted">{resolved.note}</p> : null}

        <dl className="mt-6 space-y-3 text-sm">
          {resolved.legalName ? (
            <div className="flex justify-between gap-4">
              <dt className="text-subtle">Empfänger</dt>
              <dd>{resolved.legalName}</dd>
            </div>
          ) : null}
          {resolved.iban ? (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-subtle">IBAN</dt>
              <dd className="font-mono text-xs">{resolved.iban}</dd>
            </div>
          ) : null}
          {resolved.bic ? (
            <div className="flex justify-between gap-4">
              <dt className="text-subtle">BIC</dt>
              <dd className="font-mono text-xs">{resolved.bic}</dd>
            </div>
          ) : null}
          {resolved.bankName ? (
            <div className="flex justify-between gap-4">
              <dt className="text-subtle">Bank</dt>
              <dd>{resolved.bankName}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          {resolved.iban ? (
            <button type="button" className="btn-ghost" onClick={() => void copy("iban", resolved.iban)}>
              {copied === "iban" ? "IBAN kopiert" : "IBAN kopieren"}
            </button>
          ) : null}
          {paypal ? (
            <a href={paypal} className="btn-primary" target="_blank" rel="noreferrer">
              PayPal
            </a>
          ) : null}
          {resolved.stripeUrl ? (
            <a href={resolved.stripeUrl} className="btn-primary" target="_blank" rel="noreferrer">
              Stripe
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
