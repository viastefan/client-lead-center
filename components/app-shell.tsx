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
  Menu,
  Plug,
  Receipt,
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
];

const FINANCE = [
  { href: "/quotes", label: "Angebote", icon: FileText },
  { href: "/invoices", label: "Rechnungen", icon: Receipt },
  { href: "/archive", label: "Archiv", icon: Archive },
];

const SYSTEM = [
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
            className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[13px] tracking-[-0.01em] transition ${
              active
                ? "bg-white/[0.09] font-medium text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                : "text-muted hover:bg-white/[0.045] hover:text-foreground"
            }`}
          >
            <Icon size={15} strokeWidth={1.5} />
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
    <div className="min-h-full lg:grid lg:grid-cols-[220px_1fr]">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-sm lg:hidden"
          aria-label="Navigation schließen"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`glass-strong fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col rounded-none border-y-0 border-l-0 px-3 py-5 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <div>
              <p className="text-[13px] font-medium tracking-tight">Lead Center</p>
              <p className="text-[11px] text-subtle">{preview ? "Studio" : "Operations"}</p>
            </div>
          </div>
          <button type="button" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Schließen">
            <X size={16} />
          </button>
        </div>

        <div className="mt-7 flex-1 space-y-6 overflow-y-auto px-0.5">
          <NavList items={PRIMARY} pathname={pathname} onNavigate={() => setOpen(false)} />
          <div>
            <p className="kicker mb-2 px-2.5">Finanzen</p>
            <NavList items={FINANCE} pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
          <div>
            <p className="kicker mb-2 px-2.5">System</p>
            <NavList items={SYSTEM} pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="glass sticky top-0 z-20 flex h-14 items-center gap-3 rounded-none border-x-0 border-t-0 px-4 md:px-8">
          <button type="button" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Navigation öffnen">
            <Menu size={18} />
          </button>
          <form action="/leads" className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/5 px-3">
            <Search size={15} className="shrink-0 text-subtle" />
            <input
              name="q"
              placeholder="Suchen"
              className="h-9 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-subtle"
            />
          </form>
          <Link href="/quotes/new" className="btn-ghost hidden h-9 sm:inline-flex">
            Angebot
          </Link>
          <Link href="/invoices/new" className="btn-ghost hidden h-9 md:inline-flex">
            Rechnung
          </Link>
          <Link
            href="/leads?status=new"
            className="relative rounded-xl p-2 text-muted transition hover:bg-white/10 hover:text-foreground"
            aria-label="Neue Leads"
          >
            <Bell size={16} />
          </Link>
          {preview ? (
            <div className="flex items-center gap-2 rounded-xl px-1.5 py-1 text-xs text-muted">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-medium text-foreground ring-1 ring-border">
                {initial}
              </span>
              <span className="hidden sm:block">
                <span className="block max-w-[140px] truncate text-foreground">{user.email}</span>
                <span className="text-subtle">Lokal gespeichert</span>
              </span>
            </div>
          ) : (
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
          )}
        </header>
        <main className="mx-auto w-full max-w-[1180px] px-4 py-8 md:px-8">
          {preview ? <PreviewBanner /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
