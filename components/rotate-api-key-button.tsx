"use client";

import { useState } from "react";
import { rotateApiKeyAction } from "@/lib/actions";
import { envSnippet } from "@/lib/integrations/snippets";
import { CopyBlock } from "@/components/copy-block";

export function RotateApiKeyButton({
  websiteId,
  customerId,
}: {
  websiteId: string;
  customerId: string;
}) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onRotate() {
    setPending(true);
    setError(null);
    const result = await rotateApiKeyAction(websiteId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setApiKey(result.apiKey ?? null);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onRotate}
        disabled={pending}
        className="h-9 rounded-lg border border-border px-3 text-sm transition hover:bg-background disabled:opacity-60"
      >
        {pending ? "Generieren…" : "API-Key neu generieren"}
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {apiKey ? (
        <CopyBlock
          label="Einmaliger API-Key · .env"
          value={envSnippet({ id: websiteId, customer_id: customerId }, apiKey)}
        />
      ) : null}
    </div>
  );
}
