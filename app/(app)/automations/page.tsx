import { PageHeader, Panel } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Automationen" };

export default async function AutomationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("automations")
    .select("id, name, trigger, action, enabled, customers(company_name)")
    .order("name");

  return (
    <>
      <PageHeader
        title="Automationen"
        description="V1 zeichnet Events wie lead.created auf. Eine Execution-Engine folgt später."
      />
      <Panel title="Definierte Automationen">
        {(data ?? []).length === 0 ? (
          <p className="text-sm text-muted">Noch keine Automationen. Trigger und Actions sind im Datenmodell vorbereitet.</p>
        ) : (
          <ul className="space-y-4 text-sm">
            {(data ?? []).map((item) => {
              const customer = Array.isArray(item.customers) ? item.customers[0] : item.customers;
              return (
                <li key={item.id}>
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-muted">
                    {customer?.company_name} · {item.trigger} → {item.action} · {item.enabled ? "aktiv" : "pausiert"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
