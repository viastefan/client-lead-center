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
    <div className="glass-strong rounded-3xl px-6 py-10">
      <h1 className="text-lg font-medium">Etwas ist schiefgelaufen</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Die Seite konnte nicht geladen werden. Andere Bereiche bleiben erreichbar.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-6">
        Erneut versuchen
      </button>
    </div>
  );
}
