import { Suspense } from "react";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";
import { SetupScreen } from "@/components/setup-screen";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = {
  title: "Anmelden",
};

export default function LoginPage() {
  if (!isSupabaseConfigured()) {
    return <SetupScreen />;
  }

  return (
    <main className="relative flex min-h-full items-center justify-center px-6 py-16">
      <div className="glass-strong relative w-full max-w-[420px] rounded-3xl px-7 py-8">
        <div className="flex items-center gap-2.5">
          <BrandMark />
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
