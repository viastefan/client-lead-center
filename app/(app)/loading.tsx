import { PageHeader } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <PageHeader title="Laden" description="Daten werden aus Supabase gelesen." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
