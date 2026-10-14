"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { adm } from "@/lib/admin";
import { cn } from "@/lib/utils";
import { useAdmin } from "./AdminContext";
import { Icon } from "./Icon";

export function Shell({ children }: { children: React.ReactNode }) {
  const { schema, user, unread } = useAdmin();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const content = schema.collections.filter((c) => c.kind === "content" && !c.hidden);
  const inbox = schema.collections.filter((c) => c.kind === "inbox" && !c.hidden);
  const badge = (key: string) => (unread as Record<string, number>)[key] ?? 0;

  const item = (href: string, label: string, icon: string, count = 0, exact = false) => {
    const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "group flex items-center gap-3 rounded-[3px] px-3 py-2 text-[13.5px] transition-colors",
          active ? "bg-white/10 font-medium text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
        )}
      >
        <Icon name={icon} className={cn("size-4 shrink-0", active ? "text-[#9db8ff]" : "")} />
        <span className="flex-1 truncate">{label}</span>
        {count > 0 && <span className="rounded-full bg-blue-bright px-1.5 py-px text-[11px] font-semibold text-white">{count}</span>}
      </Link>
    );
  };

  async function logout() {
    await adm("/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <span className="flex size-8 items-center justify-center bg-blue font-serif text-sm italic text-white">RT</span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Dashboard</p>
          <p className="text-[11px] text-white/50">Content management</p>
        </div>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <div className="space-y-0.5">{item("/admin", "Overview", "dashboard", 0, true)}</div>
        <div>
          <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/35">Inbox</p>
          <div className="space-y-0.5">{inbox.map((c) => item(`/admin/c/${c.key}`, c.label, c.icon, badge(c.key)))}</div>
        </div>
        <div>
          <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/35">Research</p>
          <div className="space-y-0.5">{item("/admin/surveys", "Surveys", "survey")}</div>
        </div>
        <div>
          <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/35">Content</p>
          <div className="space-y-0.5">{content.map((c) => item(`/admin/c/${c.key}`, c.label, c.icon))}</div>
        </div>
        <div>
          <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/35">Site</p>
          <div className="space-y-0.5">
            {item("/admin/media", "Media library", "media")}
            {item("/admin/settings", "Settings", "settings")}
            {user.role === "admin" && item("/admin/team", "Team", "team")}
            {item("/admin/activity", "Activity log", "activity")}
          </div>
        </div>
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link href="/admin/account" className="flex items-center gap-3 rounded-[3px] px-2 py-2 hover:bg-white/5">
          <span className="flex size-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
            {user.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px] font-medium text-white">{user.name}</span>
            <span className="block text-[11px] capitalize text-white/50">{user.role}</span>
          </span>
        </Link>
        <button type="button" onClick={logout} className="mt-1 flex w-full items-center gap-3 rounded-[3px] px-3 py-2 text-[13px] text-white/60 hover:bg-white/5 hover:text-white">
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6fa]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy-deep lg:block">{sidebar}</aside>
      <div className={cn("fixed inset-0 z-40 lg:hidden", open ? "visible" : "invisible")}>
        <div className={cn("absolute inset-0 bg-ink/50 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <aside className={cn("absolute inset-y-0 left-0 w-72 bg-navy-deep transition-transform", open ? "translate-x-0" : "-translate-x-full")}>
          <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-4 text-white/70" aria-label="Close menu">
            <X className="size-5" />
          </button>
          {sidebar}
        </aside>
      </div>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur md:px-8">
          <button type="button" onClick={() => setOpen(true)} className="flex size-9 items-center justify-center lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="hidden text-sm text-muted lg:block">Signed in as {user.email}</div>
          <a href="/" target="_blank" className="inline-flex items-center gap-2 text-sm font-medium text-blue hover:text-navy">
            View website <ExternalLink className="size-3.5" />
          </a>
        </header>
        <main className="px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
