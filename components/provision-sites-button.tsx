"use client";

import { useState } from "react";
import { provisionVercelSitesAction, type ProvisionedKey } from "@/lib/actions";
import { envSnippet } from "@/lib/integrations/snippets";
import { CopyBlock } from "@/components/copy-block";

export function ProvisionSitesButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [keys, setKeys] = useState<ProvisionedKey[]>([]);

  async function onProvision() {
    setPending(true);
    setError(null);
    setSummary(null);
    const result = await provisionVercelSitesAction();
    setPending(false);
    if (result.error) {
      setError(result.error);
      setKeys(result.keys);
      return;
    }
    setKeys(result.keys);
    setSummary(
      result.created === 0
        ? `${result.existing} Live-Websites sind bereits angebunden.`
        : `${result.created} Website${result.created === 1 ? "" : "s"} angelegt, ${result.existing} bereits vorhanden.`,
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onProvision}
        disabled={pending}
        className="btn-primary"
      >
        {pending ? "Binde an…" : "Alle Live-Websites anbinden"}
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {summary ? <p className="text-sm text-muted">{summary}</p> : null}
      {keys.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-muted">
            API-Keys erscheinen nur dieses eine Mal. In den Kundenprojekten als Server-Secrets hinterlegen
            — niemals mit <code className="font-mono text-foreground">NEXT_PUBLIC_</code>.
          </p>
          {keys.map((item) => (
            <CopyBlock
              key={item.websiteId}
              label={`${item.companyName} · .env`}
              value={envSnippet(
                { id: item.websiteId, customer_id: item.customerId },
                item.apiKey,
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
