import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { isPreviewMode, previewUser } from "@/lib/data/workspace";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (isPreviewMode()) {
    return (
      <AppShell user={previewUser()} preview>
        {children}
      </AppShell>
    );
  }

  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
