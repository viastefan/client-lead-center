"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/ui";
import { kindHref } from "@/lib/billing/labels";
import { useBilling } from "@/lib/billing/store";
import { derivedReminders, mergeReminders } from "@/lib/ops/reminders";

export function ReminderBoard() {
  const searchParams = useSearchParams();
  const { ready, documents, reminders, addReminder, completeReminder } = useBilling();
  const [title, setTitle] = useState(() => searchParams.get("title") ?? "");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const rows = useMemo(() => mergeReminders(reminders, derivedReminders(documents)), [documents, reminders]);
  const open = rows.filter((item) => item.status === "open");
  const done = rows.filter((item) => item.status === "done");

  if (!ready) return <div className="glass h-40 animate-pulse rounded-lg" />;

  return (
    <>
      <PageHeader
        title="Erinnerungen"
        description="Nachfassen, Zahlungserinnerungen und Vertragsenden. Manuell oder aus Dokumenten."
      />
      <form
        className="mb-6 grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_auto_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          addReminder({ title: title.trim(), note: "", dueDate, source: "manual", relatedId: null, customerName: "" });
          setTitle("");
        }}
      >
        <input className="field" placeholder="Neue Erinnerung" value={title} onChange={(event) => setTitle(event.target.value)} />
        <input className="field" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        <button type="submit" className="btn-primary">
          Anlegen
        </button>
      </form>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {open.length === 0 ? (
          <li className="px-4 py-8 text-[13px] text-muted">Keine offenen Erinnerungen.</li>
        ) : (
          open.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">{item.title}</p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {item.dueDate}
                  {item.customerName ? ` · ${item.customerName}` : ""}
                  {item.note ? ` · ${item.note}` : ""}
                </p>
              </div>
              <StatusBadge tone={item.source === "invoice" ? "danger" : "warning"}>
                {item.source === "invoice"
                  ? "Rechnung"
                  : item.source === "quote"
                    ? "Angebot"
                    : item.source === "contract"
                      ? "Vertrag"
                      : item.source === "lead"
                        ? "Lead"
                        : "Manuell"}
              </StatusBadge>
              {item.relatedId && item.source !== "manual" && item.source !== "lead" ? (
                <Link href={`${kindHref(item.source)}/${item.relatedId}`} className="btn-ghost h-8">
                  Öffnen
                </Link>
              ) : null}
              <button type="button" className="btn-ghost h-8" onClick={() => completeReminder(item.id)}>
                Erledigt
              </button>
            </li>
          ))
        )}
      </ul>
      {done.length > 0 ? (
        <div className="mt-8">
          <p className="kicker mb-3">Erledigt</p>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {done.map((item) => (
              <li key={item.id} className="px-4 py-2 text-[13px] text-muted">
                {item.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
