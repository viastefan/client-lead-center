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
  Plug,
  Search,
  Settings,
  Users,
  Globe,
  Workflow,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import type { SessionUser } from "@/types";

const PRIMARY = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/clients", label: "Kunden", icon: Users },
  { href: "/websites", label: "Websites", icon: Globe },
  { href: "/leads", label: "Leads", icon: Inbox },
];

const SYSTEM = [
  { href: "/emails", label: "E-Mails", icon: Mail },
  { href: "/automations", label: "Automationen", icon: Workflow },
  { href: "/integrations", label: "Verbindungen", icon: Plug },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: typeof PRIMARY;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition ${
              active
                ? "bg-white/10 font-medium text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                : "text-muted hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <Icon size={15} strokeWidth={1.6} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
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
  const initial = (user.profile?.full_name || user.email || "A").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[248px_1fr]">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-sm lg:hidden"
          aria-label="Navigation schließen"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`glass-strong fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col rounded-none border-y-0 border-l-0 px-3 py-5 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <div>
              <p className="text-[13px] font-medium tracking-tight">Client Lead Center</p>
              <p className="text-[11px] text-subtle">Operations</p>
            </div>
          </div>
          <button type="button" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Schließen">
            <X size={16} />
          </button>
        </div>

        <div className="mt-7 flex-1 space-y-6 overflow-y-auto px-0.5">
          <NavList items={PRIMARY} pathname={pathname} onNavigate={() => setOpen(false)} />
          <div>
            <p className="mb-2 px-2.5 text-[11px] font-medium uppercase tracking-wider text-subtle">System</p>
            <NavList items={SYSTEM} pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="glass sticky top-0 z-20 flex h-14 items-center gap-3 rounded-none border-x-0 border-t-0 px-4 md:px-8">
          <button type="button" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Navigation öffnen">
            <Menu size={18} />
          </button>
          <form action="/leads" className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white/5 px-3">
            <Search size={15} className="shrink-0 text-subtle" />
            <input
              name="q"
              placeholder="Leads, Kunden, Domains suchen"
              className="h-9 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-subtle"
            />
          </form>
          <Link
            href="/leads?status=new"
            className="rounded-xl p-2 text-muted transition hover:bg-white/10 hover:text-foreground"
            aria-label="Neue Leads"
          >
            <Bell size={16} />
          </Link>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl px-1.5 py-1 text-left text-xs text-muted transition hover:bg-white/10"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-medium text-foreground ring-1 ring-border">
                {initial}
              </span>
              <span className="hidden sm:block">
                <span className="block max-w-[140px] truncate text-foreground">{user.email}</span>
                <span className="text-subtle">Abmelden</span>
              </span>
            </button>
          </form>
        </header>
        <main className="px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
