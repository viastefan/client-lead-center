import { BrandMark } from "@/components/brand-mark";
import { VERCEL_CUSTOMER_SITES } from "@/lib/catalog/vercel-sites";

export function SetupScreen() {
  return (
    <main className="relative mx-auto flex min-h-full max-w-2xl flex-col justify-center px-6 py-16">
      <BrandMark />
      <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.22em] text-subtle">
        Client Lead Center
      </p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight">Supabase verbinden</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
        Die App läuft. Es fehlen noch Umgebungsvariablen für Projekt{" "}
        <code className="font-mono text-foreground">fneitubfxquybvexlole</code> und die beiden
        SQL-Migrationen. Danach binden Sie unter Verbindungen alle Live-Websites an.
      </p>
      <ul className="glass mt-8 divide-y divide-border overflow-hidden rounded-3xl">
        {VERCEL_CUSTOMER_SITES.map((site) => (
          <li key={site.slug} className="flex items-start justify-between gap-4 px-5 py-3.5">
            <div className="min-w-0">
              <p className="text-sm font-medium">{site.companyName}</p>
              <p className="mt-1 truncate text-xs text-muted">{site.domain}</p>
            </div>
            <p className="shrink-0 text-xs text-subtle">{site.slug}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
