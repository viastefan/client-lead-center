import { ActivityLog } from "@/components/ops/activity-log";
import { MonitorBoard } from "@/components/ops/monitor-board";
import { PageHeader } from "@/components/ui";
import {
  hasClaudeKey,
  hasGoogleOAuth,
  hasIonosSmtp,
  hasMicrosoftOAuth,
  hasResendKey,
  isSupabaseAdminConfigured,
} from "@/lib/env";
import { isPreviewMode, loadDashboardStats } from "@/lib/data/workspace";

export const metadata = { title: "Überwachung" };

export default async function MonitorPage() {
  const stats = await loadDashboardStats();
  const preview = isPreviewMode();
  const system = [
    { label: "API", ok: true, note: "Operational" },
    { label: "Database", ok: !stats.migrationMissing, note: stats.migrationMissing ? "Warning" : preview ? "Preview" : "Operational" },
    { label: "Storage", ok: isSupabaseAdminConfigured(), note: isSupabaseAdminConfigured() ? "Operational" : "Warning" },
    {
      label: "E-Mail",
      ok: hasResendKey() || hasGoogleOAuth() || hasMicrosoftOAuth() || hasIonosSmtp(),
      note: hasIonosSmtp() ? "IONOS" : hasResendKey() ? "Resend" : "Warning",
    },
    { label: "AI", ok: hasClaudeKey(), note: hasClaudeKey() ? "Operational" : "Warning" },
  ];

  return (
    <>
      <PageHeader
        title="Überwachung"
        description="Erreichbarkeit der Kundenwebsites und Zustand der internen Systeme."
      />
      <MonitorBoard system={system} />
      <div className="mt-6">
        <ActivityLog />
      </div>
    </>
  );
}
