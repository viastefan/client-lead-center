import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto flex min-h-full max-w-xl flex-col justify-center px-6 py-16">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-medium text-white">
          C
        </span>
        <h1 className="mt-5 text-3xl font-medium tracking-tight">Supabase verbinden</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Die App ist startklar, aber es fehlen noch Umgebungsvariablen. Tragen Sie URL und Keys
          für das Projekt <code className="font-mono text-foreground">fneitubfxquybvexlole</code> in
          <code className="font-mono text-foreground"> .env.local</code> ein und führen Sie beide SQL-Migrationen aus.
        </p>
      </main>
    );
  }

  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
