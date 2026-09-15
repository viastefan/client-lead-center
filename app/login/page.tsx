import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Anmelden",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <p className="text-sm tracking-wide text-subtle">Client Lead Center</p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight">Anmelden</h1>
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
