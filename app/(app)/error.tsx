"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-10">
      <h1 className="text-lg font-medium">Etwas ist schiefgelaufen</h1>
      <p className="mt-2 text-sm text-muted">Die Seite konnte nicht geladen werden. Bitte versuchen Sie es erneut.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 h-9 rounded-lg border border-border px-3 text-sm"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
