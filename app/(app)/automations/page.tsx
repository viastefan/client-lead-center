import { PageHeader, Panel, StatusBadge } from "@/components/ui";
import { loadAutomations } from "@/lib/data/workspace";

export const metadata = { title: "Automationen" };

export default async function AutomationsPage() {
  const automations = await loadAutomations();

  return (
    <>
      <PageHeader
        title="Automationen"
        description="V1 zeichnet Events wie lead.created auf. Eine Execution-Engine folgt später."
      />
      <Panel title="Definierte Automationen">
        {automations.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Automationen. Trigger und Actions sind im Datenmodell vorbereitet.</p>
        ) : (
          <ul className="space-y-4 text-sm">
            {automations.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-muted">
                    {item.customers?.company_name} · {item.trigger} → {item.action}
                  </p>
                </div>
                <StatusBadge tone={item.enabled ? "success" : "neutral"}>
                  {item.enabled ? "aktiv" : "pausiert"}
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
