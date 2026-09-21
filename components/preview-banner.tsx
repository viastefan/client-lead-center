import Link from "next/link";

export function PreviewBanner() {
  return (
    <div className="preview-banner mb-6 flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5">
      <p className="text-[13px] text-muted">Vorschau — Finanzen und Sites laufen lokal, bis Supabase verbunden ist.</p>
      <Link href="/settings" className="btn-ghost shrink-0">
        Setup
      </Link>
    </div>
  );
}
