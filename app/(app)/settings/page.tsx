import { PageHeader, Panel } from "@/components/ui";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata = { title: "Einstellungen" };

export default async function SettingsPage() {
  const user = await requireSessionUser();

  return (
    <>
      <PageHeader title="Einstellungen" description="Konto und Mandantenfähigkeit. Passwörter werden ausschließlich über Supabase Auth verwaltet." />
      <Panel title="Konto">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-subtle">E-Mail</dt>
            <dd className="mt-1">{user.email}</dd>
          </div>
          <div>
            <dt className="text-subtle">Rolle</dt>
            <dd className="mt-1">{user.profile?.role ?? "unbekannt"}</dd>
          </div>
        </dl>
      </Panel>
      <Panel title="Sicherheit">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
          <li>API-Keys werden nur als Hash gespeichert.</li>
          <li>Service-Role-Keys gehören ausschließlich auf den Server.</li>
          <li>Kundenwebsites dürfen den Lead-API-Key nicht im Browser ausliefern.</li>
          <li>Vercel Blob wird nicht verwendet. Dateien liegen in Supabase Storage.</li>
        </ul>
      </Panel>
    </>
  );
}
