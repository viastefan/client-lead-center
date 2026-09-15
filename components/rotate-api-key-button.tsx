"use client";

import { useState } from "react";
import { rotateApiKeyAction } from "@/lib/actions";

export function RotateApiKeyButton({ websiteId }: { websiteId: string }) {
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
        className="h-9 rounded-lg border border-border px-3 text-sm disabled:opacity-60"
      >
        {pending ? "Generieren…" : "API-Key neu generieren"}
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {apiKey ? (
        <div className="rounded-lg border border-border bg-background px-4 py-3">
          <p className="text-xs text-muted">Diesen Schlüssel jetzt kopieren. Er wird nicht erneut angezeigt.</p>
          <p className="mt-2 break-all font-mono text-sm">{apiKey}</p>
        </div>
      ) : null}
    </div>
  );
}
