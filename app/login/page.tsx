import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Anmelden",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-full items-center justify-center px-6 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_55%)]" />
      <div className="relative w-full max-w-[420px] rounded-2xl border border-border bg-card px-7 py-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-medium text-white">
            C
          </span>
          <p className="text-sm tracking-wide text-subtle">Client Lead Center</p>
        </div>
        <h1 className="mt-6 text-3xl font-medium tracking-tight">Anmelden</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
          Internes Operations-System. Nur autorisierte Administratoren.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
