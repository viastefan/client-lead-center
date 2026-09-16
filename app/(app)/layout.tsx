import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SetupScreen } from "@/components/setup-screen";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return <SetupScreen />;
  }

  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
