import Link from "next/link";

export function PreviewBanner() {
  return (
    <div className="glass mb-6 flex flex-col gap-3 rounded-3xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">Vorschau mit den acht Live-Sites</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          Die Oberfläche ist vollständig nutzbar. Für echte Leads Supabase-Projekt{" "}
          <code className="font-mono text-foreground">fneitubfxquybvexlole</code> verbinden.
        </p>
      </div>
      <Link href="/settings" className="btn-ghost shrink-0">
        Setup
      </Link>
    </div>
  );
}
