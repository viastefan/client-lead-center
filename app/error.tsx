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
    <main className="relative flex min-h-full items-center justify-center px-6 py-16">
      <div className="glass-strong w-full max-w-md rounded-lg px-8 py-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-subtle">Fehler</p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight">Kurz unterbrochen</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Die Seite konnte nicht geladen werden. Der Server bleibt erreichbar — bitte erneut
          versuchen.
        </p>
        <button type="button" onClick={reset} className="btn-primary mt-8">
          Erneut versuchen
        </button>
      </div>
    </main>
  );
}
