import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/session";
import { VERCEL_CUSTOMER_SITES } from "@/lib/catalog/vercel-sites";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-6 py-16">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-medium text-white">
          C
        </span>
        <h1 className="mt-5 text-3xl font-medium tracking-tight">Supabase verbinden</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Die App ist startklar, aber es fehlen noch Umgebungsvariablen. Tragen Sie URL und Keys
          für das Projekt <code className="font-mono text-foreground">fneitubfxquybvexlole</code> in
          <code className="font-mono text-foreground"> .env.local</code> ein und führen Sie beide SQL-Migrationen aus.
          Danach binden Sie unter Verbindungen alle Live-Websites an.
        </p>
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
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

  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
