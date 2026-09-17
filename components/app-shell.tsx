"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  Bell,
  FileText,
  Inbox,
  LayoutGrid,
  Mail,
  Menu,
  Plug,
  Receipt,
  ScrollText,
  Search,
  Settings,
  Users,
  Globe,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { PreviewBanner } from "@/components/preview-banner";
import type { SessionUser } from "@/types";

const PRIMARY = [
  { href: "/", label: "Übersicht", icon: LayoutGrid },
  { href: "/clients", label: "Kunden", icon: Users },
  { href: "/leads", label: "Leads", icon: Inbox },
  { href: "/reminders", label: "Erinnerungen", icon: Bell },
];

const FINANCE = [
  { href: "/quotes", label: "Angebote", icon: FileText },
  { href: "/invoices", label: "Rechnungen", icon: Receipt },
  { href: "/contracts", label: "Verträge", icon: ScrollText },
  { href: "/archive", label: "Archiv", icon: Archive },
];

const SYSTEM = [
  { href: "/emails", label: "E-Mail", icon: Mail },
  { href: "/websites", label: "Websites", icon: Globe },
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
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition ${
              active ? "bg-white/10 font-medium text-foreground" : "text-muted hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <Icon size={14} strokeWidth={1.75} />
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
  preview = false,
}: {
  user: SessionUser;
  children: React.ReactNode;
  preview?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initial = (user.profile?.full_name || user.email || "A").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[232px_1fr]">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-label="Navigation schließen"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`glass-strong fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col rounded-none border-y-0 border-l-0 border-r border-border px-3 py-4 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <BrandMark size="sm" />
            <div>
              <p className="text-[13px] font-medium">Lead Center</p>
              <p className="text-[11px] text-subtle">{preview ? "Preview" : "Production"}</p>
            </div>
          </div>
          <button type="button" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Schließen">
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 flex-1 space-y-6 overflow-y-auto px-0.5">
          <NavList items={PRIMARY} pathname={pathname} onNavigate={() => setOpen(false)} />
          <div>
            <p className="kicker mb-2 px-2">Finanzen</p>
            <NavList items={FINANCE} pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
          <div>
            <p className="kicker mb-2 px-2">System</p>
            <NavList items={SYSTEM} pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border bg-black px-4 md:px-6">
          <button type="button" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Navigation öffnen">
            <Menu size={18} />
          </button>
          <form action="/leads" className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-[#0a0a0a] px-3">
            <Search size={14} className="shrink-0 text-subtle" />
            <input
              name="q"
              placeholder="Suchen"
              className="h-8 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-subtle"
            />
          </form>
          <Link href="/quotes/new" className="btn-ghost hidden sm:inline-flex">
            Angebot
          </Link>
          <Link href="/invoices/new" className="btn-ghost hidden md:inline-flex">
            Rechnung
          </Link>
          <Link href="/contracts/new" className="btn-ghost hidden lg:inline-flex">
            Vertrag
          </Link>
          <Link href="/reminders" className="rounded-md p-2 text-muted transition hover:bg-white/10 hover:text-foreground" aria-label="Erinnerungen">
            <Bell size={15} />
          </Link>
          {preview ? (
            <div className="flex items-center gap-2 px-1 text-xs text-muted">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-medium text-foreground">
                {initial}
              </span>
              <span className="hidden max-w-[140px] truncate sm:block">{user.email}</span>
            </div>
          ) : (
            <form action="/logout" method="post">
              <button type="submit" className="flex items-center gap-2 px-1 text-xs text-muted">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-medium text-foreground">
                  {initial}
                </span>
                <span className="hidden sm:block">Abmelden</span>
              </button>
            </form>
          )}
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6">
          {preview ? <PreviewBanner /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
