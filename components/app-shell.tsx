"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  Bell,
  Clock,
  FileText,
  Inbox,
  LayoutGrid,
  Mail,
  Menu,
  Plug,
  Receipt,
  ScrollText,
  Settings,
  Users,
  Globe,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { CommandPalette } from "@/components/ops/command-palette";
import { PreviewBanner } from "@/components/preview-banner";
import { useBilling } from "@/lib/billing/store";
import { buildInbox } from "@/lib/ops/inbox";
import type { SessionUser } from "@/types";

const PRIMARY = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/", label: "Übersicht", icon: LayoutGrid },
  { href: "/monitor", label: "Überwachung", icon: Activity },
  { href: "/clients", label: "Kunden", icon: Users },
  { href: "/leads", label: "Leads", icon: Bell },
];

const FINANCE = [
  { href: "/quotes", label: "Angebote", icon: FileText },
  { href: "/invoices", label: "Rechnungen", icon: Receipt },
  { href: "/contracts", label: "Verträge", icon: ScrollText },
  { href: "/reminders", label: "Erinnerungen", icon: Clock },
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
  badge,
}: {
  items: typeof PRIMARY;
  pathname: string;
  onNavigate: () => void;
  badge?: Record<string, number>;
}) {
  return (
    <nav className="space-y-px">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        const count = badge?.[item.href] ?? 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition ${
              active
                ? "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] font-medium text-foreground"
                : "text-muted hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <Icon size={14} strokeWidth={1.75} />
            <span className="flex-1">{item.label}</span>
            {count > 0 ? (
              <span className="rounded bg-white/10 px-1.5 text-[10px] tabular-nums text-foreground">{count}</span>
            ) : null}
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
  leadInbox = 0,
}: {
  user: SessionUser;
  children: React.ReactNode;
  preview?: boolean;
  leadInbox?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { documents, reminders, ready } = useBilling();
  const inboxCount = useMemo(
    () => (ready ? buildInbox({ documents, reminders }).length : 0) + leadInbox,
    [documents, leadInbox, ready, reminders],
  );
  const initial = (user.profile?.full_name || user.email || "A").slice(0, 1).toUpperCase();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const nav = (
    <>
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <BrandMark size="sm" />
          <div>
            <p className="text-[13px] font-medium">Lead Center</p>
            <p className="text-[11px] text-subtle">{preview ? "Preview" : "Stefan Dirnberger"}</p>
          </div>
        </div>
        <button type="button" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Schließen">
          <X size={16} />
        </button>
      </div>

      <div className="mt-5 space-y-5 px-0.5">
        <NavList items={PRIMARY} pathname={pathname} onNavigate={() => setOpen(false)} badge={{ "/inbox": inboxCount }} />
        <div>
          <p className="kicker mb-1.5 px-2">Finanzen</p>
          <NavList items={FINANCE} pathname={pathname} onNavigate={() => setOpen(false)} />
        </div>
        <div>
          <p className="kicker mb-1.5 px-2">System</p>
          <NavList items={SYSTEM} pathname={pathname} onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </>
  );

  return (
    <div className="lg:flex">
      <CommandPalette />
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-label="Navigation schließen"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-svh w-[220px] shrink-0 flex-col border-r border-border bg-[#0c0c0d] px-3 py-4 transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {nav}
        <div className="mt-auto border-t border-border px-2 pt-3">
          <p className="truncate text-[12px] text-muted">{user.email}</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border bg-[#0c0c0d] px-4 md:px-6">
          <button type="button" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Navigation öffnen">
            <Menu size={18} />
          </button>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-[#141416] px-3 text-left"
            onClick={() => window.dispatchEvent(new Event("clc-cmdk"))}
          >
            <span className="h-8 flex-1 text-[13px] leading-8 text-subtle">Suchen</span>
            <kbd className="hidden rounded border border-border px-1 text-[10px] text-subtle sm:inline">⌘K</kbd>
          </button>
          <Link href="/quotes/new" className="btn-ghost hidden sm:inline-flex">
            Angebot
          </Link>
          <Link href="/invoices/new" className="btn-primary hidden sm:inline-flex">
            Rechnung
          </Link>
          <Link href="/inbox" className="relative rounded-md p-2 text-muted transition hover:bg-white/10 hover:text-foreground" aria-label="Inbox">
            <Inbox size={15} />
            {inboxCount > 0 ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" /> : null}
          </Link>
          {preview ? (
            <div className="flex items-center gap-2 px-1 text-xs text-muted">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-medium text-foreground">
                {initial}
              </span>
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
        <main className="mx-auto w-full max-w-[1120px] px-4 py-7 md:px-6">
          {preview ? <PreviewBanner /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
