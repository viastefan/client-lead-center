import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return (
    <main className="relative flex min-h-full items-center justify-center px-6 py-16">
      <div className="glass-strong w-full max-w-md rounded-3xl px-8 py-10">
        <BrandMark />
        <h1 className="mt-6 text-3xl font-medium tracking-tight">Seite nicht gefunden</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Diese Adresse gibt es in Client Lead Center nicht. Die App läuft — prüfen Sie den Pfad
          oder gehen Sie zum Dashboard.
        </p>
        <Link href="/" className="btn-primary mt-8">
          Zum Dashboard
        </Link>
      </div>
    </main>
  );
}
