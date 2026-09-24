"use client";

import { useState } from "react";
import { Panel } from "@/components/ui";
import { buildWorkspaceBackup, mergeWorkspaceBackup, parseWorkspaceBackup } from "@/lib/billing/backup";
import { useBilling } from "@/lib/billing/store";
import { readLocalCustomers, replaceLocalCustomers } from "@/lib/crm/store";

export function WorkspaceBackup() {
  const { ready, company, documents, reminders, sequences, replaceBilling } = useBilling();
  const [flash, setFlash] = useState("");

  function exportBackup() {
    const backup = buildWorkspaceBackup(
      { version: 2, company, documents, reminders, sequences },
      readLocalCustomers(),
    );
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `stefan-dirnberger-buero-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setFlash("Export gespeichert");
    window.setTimeout(() => setFlash(""), 1600);
  }

  async function importBackup(file: File) {
    const parsed = parseWorkspaceBackup(await file.text());
    if (!parsed) {
      setFlash("Datei ungültig");
      window.setTimeout(() => setFlash(""), 2000);
      return;
    }
    const merged = mergeWorkspaceBackup(
      { version: 2, company, documents, reminders, sequences },
      readLocalCustomers(),
      parsed,
    );
    replaceBilling(merged.billing);
    replaceLocalCustomers(merged.crm);
    setFlash(`${parsed.billing.documents.length} Dokumente übernommen`);
    window.setTimeout(() => setFlash(""), 2200);
  }

  if (!ready) return null;

  return (
    <Panel title="Sicherung" description="Angebote, Rechnungen, Verträge und lokale Kundendaten. Firma bleibt erhalten, leere Felder werden ergänzt.">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" onClick={exportBackup}>
          Exportieren
        </button>
        <label className="btn-ghost cursor-pointer">
          Importieren
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importBackup(file);
              event.target.value = "";
            }}
          />
        </label>
        {flash ? <p className="self-center text-[13px] text-muted">{flash}</p> : null}
      </div>
    </Panel>
  );
}
