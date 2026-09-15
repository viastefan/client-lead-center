"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Inbox,
  LayoutGrid,
  Mail,
  Menu,
  Puzzle,
  Search,
  Settings,
  Users,
  Globe,
  Workflow,
  X,
} from "lucide-react";
import type { SessionUser } from "@/types";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/clients", label: "Kunden", icon: Users },
  { href: "/websites", label: "Websites", icon: Globe },
  { href: "/leads", label: "Leads", icon: Inbox },
  { href: "/emails", label: "E-Mails", icon: Mail },
  { href: "/automations", label: "Automationen", icon: Workflow },
  { href: "/integrations", label: "Integrationen", icon: Puzzle },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[220px_1fr]">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          aria-label="Navigation schließen"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[220px] border-r border-border bg-card px-4 py-6 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <div>
            <p className="text-[13px] font-medium tracking-tight">Client Lead Center</p>
            <p className="mt-1 text-xs text-subtle">Operations</p>
          </div>
          <button type="button" className="lg:hidden" onClick={() => setOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <nav className="mt-8 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition ${
                  active
                    ? "bg-background text-foreground"
                    : "text-muted hover:bg-background hover:text-foreground"
                }`}
              >
                <Icon size={15} strokeWidth={1.6} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-8">
          <button type="button" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu size={18} />
          </button>
          <form action="/leads" className="flex min-w-0 flex-1 items-center gap-2">
            <Search size={15} className="shrink-0 text-subtle" />
            <input
              name="q"
              placeholder="Leads suchen"
              className="h-9 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-subtle"
            />
          </form>
          <Link href="/leads?status=new" className="rounded-md p-2 text-muted hover:bg-card">
            <Bell size={16} />
          </Link>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-left text-xs text-muted hover:bg-card"
            >
              <span className="block max-w-[140px] truncate">{user.email}</span>
              <span className="text-subtle">Abmelden</span>
            </button>
          </form>
        </header>
        <main className="px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
