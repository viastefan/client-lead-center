"use client";

import Link from "next/link";

export function LeadWorkActions({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string;
}) {
  const query = customerId ? `?customer=${customerId}` : "";
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/quotes/new${query}`} className="btn-primary">
        Angebot
      </Link>
      <Link href={`/invoices/new${query}`} className="btn-ghost">
        Rechnung
      </Link>
      <Link href={`/contracts/new${query}`} className="btn-ghost">
        Vertrag
      </Link>
      <Link
        href={`/reminders?title=${encodeURIComponent(`Nachfassen ${customerName}`)}`}
        className="btn-ghost"
      >
        Erinnerung
      </Link>
    </div>
  );
}
