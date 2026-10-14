"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, FileText, Images, Newspaper, Plus } from "lucide-react";
import { useAdmin } from "@/components/admin/AdminContext";
import { Icon } from "@/components/admin/Icon";
import { Badge, PageTitle, Panel } from "@/components/admin/UI";
import { adm, relativeTime } from "@/lib/admin";
import { todayLine } from "@/lib/i18n";
import { formatBytes } from "@/lib/utils";

interface Overview {
  counts: Record<string, number>;
  unread: { messages: number; volunteers: number; grievances: number };
  grievanceStatus: { status: string; count: number }[];
  recentGrievances: { id: number; code: string; subject: string; category: string; ward: string; status: string; created_at: string }[];
  recentMessages: { id: number; name: string; subject: string; status: string; created_at: string }[];
  activity: { id: number; user_name: string; action: string; collection: string | null; item_title: string | null; created_at: string }[];
  media: { n: number; bytes: number };
  surveys: { open: number; responses: number; week: number };
}

export default function OverviewPage() {
  const { user, schema } = useAdmin();
  const [o, setO] = useState<Overview | null>(null);

  useEffect(() => {
    adm<Overview>("/admin/overview").then(setO);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const labelOf = (key: string | null) => schema.collections.find((c) => c.key === key)?.label ?? key ?? "";
  const shown = (key: string) => schema.collections.some((c) => c.key === key && !c.hidden);
  const grievancesOn = shown("grievances");

  const quick = [
    { href: "/admin/c/posts/new", label: "Write news", icon: Newspaper },
    { href: "/admin/c/albums/new", label: "New photo album", icon: Images },
    { href: "/admin/c/achievements/new", label: "Add work", icon: Plus },
    shown("documents")
      ? { href: "/admin/c/documents/new", label: "Publish a document", icon: FileText }
      : { href: "/admin/surveys", label: "Create a survey", icon: FileText },
  ];

  const totalGrievances = o?.grievanceStatus.reduce((a, g) => a + g.count, 0) ?? 0;

  return (
    <>
      <PageTitle title={`${greeting}, ${user.name.split(" ")[0]}.`} description={todayLine("np")} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quick.map((q) => (
          <Link key={q.href} href={q.href} className="group flex items-center gap-3 border border-line bg-white px-4 py-4 transition-colors hover:border-blue">
            <span className="flex size-9 items-center justify-center bg-blue-soft text-blue">
              <q.icon className="size-4" />
            </span>
            <span className="flex-1 text-sm font-medium">{q.label}</span>
            <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-blue" />
          </Link>
        ))}
      </div>

      {/* Needs attention */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { key: "grievances", label: "Open grievances", value: o?.unread.grievances },
          { key: "messages", label: "Unread messages", value: o?.unread.messages },
          { key: "volunteers", label: "New volunteers", value: o?.unread.volunteers },
          { key: "surveys", label: "Survey responses this week", value: o?.surveys.week, href: "/admin/surveys" },
        ]
          .filter((s) => s.key !== "grievances" || grievancesOn)
          .map((s) => (
          <Link key={s.key} href={s.href ?? `/admin/c/${s.key}`} className="group relative overflow-hidden bg-navy p-6 text-white">
            <div className="grid-lines absolute inset-0 opacity-60" aria-hidden />
            <div className="relative">
              <p className="text-sm text-white/60">{s.label}</p>
              <p className="mt-2 font-serif text-5xl leading-none">{s.value ?? "–"}</p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#9db8ff]">
                Open <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {!grievancesOn && (
          <Panel
            title="Latest messages"
            className="xl:col-span-2"
            actions={
              <Link href="/admin/c/messages" className="text-xs font-medium text-blue">
                View all
              </Link>
            }
          >
            {o && o.recentMessages.length === 0 && <p className="p-8 text-center text-sm text-muted">No messages yet.</p>}
            <ul>
              {o?.recentMessages.map((m) => (
                <li key={m.id} className="border-b border-line last:border-0">
                  <Link href={`/admin/c/messages/${m.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f8faff]">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{m.subject || m.name}</span>
                      <span className="text-xs text-muted">
                        {m.name} · {relativeTime(m.created_at)}
                      </span>
                    </span>
                    <Badge>{m.status || "New"}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}
        {grievancesOn && (
        <Panel
          title="Latest grievances"
          className="xl:col-span-2"
          actions={
            <Link href="/admin/c/grievances" className="text-xs font-medium text-blue">
              View all
            </Link>
          }
        >
          {o && o.recentGrievances.length === 0 && <p className="p-8 text-center text-sm text-muted">No grievances filed yet.</p>}
          <ul>
            {o?.recentGrievances.map((g) => (
              <li key={g.id} className="border-b border-line last:border-0">
                <Link href={`/admin/c/grievances/${g.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f8faff]">
                  <span className="hidden font-mono text-xs text-muted sm:block">{g.code}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{g.subject}</span>
                    <span className="text-xs text-muted">
                      {g.category}
                      {g.ward && ` · Ward ${g.ward}`} · {relativeTime(g.created_at)}
                    </span>
                  </span>
                  <Badge>{g.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
          {totalGrievances > 0 && (
            <div className="border-t border-line px-5 py-4">
              <div className="flex h-2 overflow-hidden rounded-full bg-paper">
                {o!.grievanceStatus.map((g) => (
                  <div
                    key={g.status}
                    style={{ width: `${(g.count / totalGrievances) * 100}%` }}
                    className={g.status === "Resolved" || g.status === "Closed" ? "bg-success" : g.status === "Received" ? "bg-blue" : "bg-[#e0a03a]"}
                    title={`${g.status}: ${g.count}`}
                  />
                ))}
              </div>
              <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted">
                {o!.grievanceStatus.map((g) => (
                  <span key={g.status}>
                    {g.status}: <b className="text-ink">{g.count}</b>
                  </span>
                ))}
              </p>
            </div>
          )}
        </Panel>
        )}

        <Panel title="Recent activity">
          <ul className="max-h-[420px] overflow-y-auto">
            {o?.activity.map((a) => (
              <li key={a.id} className="flex gap-3 border-b border-line px-5 py-3 text-[13px] last:border-0">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue" />
                <span className="min-w-0 flex-1">
                  <b className="font-semibold">{a.user_name}</b> {a.action}{" "}
                  {a.item_title && <span className="text-ink/80">“{a.item_title}”</span>}
                  {a.collection && !a.item_title && <span className="text-muted">{labelOf(a.collection)}</span>}
                  <span className="block text-xs text-muted">{relativeTime(a.created_at)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Website content" className="mt-6">
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-5">
          {schema.collections
            .filter((c) => c.kind === "content" && !c.hidden)
            .map((c) => (
              <Link key={c.key} href={`/admin/c/${c.key}`} className="group flex items-center gap-3 bg-white px-5 py-4 hover:bg-[#f8faff]">
                <Icon name={c.icon} className="size-4 text-blue" />
                <span className="flex-1 text-sm">{c.label}</span>
                <span className="font-serif text-xl">{o?.counts[c.key] ?? "–"}</span>
              </Link>
            ))}
          <Link href="/admin/media" className="col-span-full flex items-center gap-3 bg-white px-5 py-4 hover:bg-[#f8faff]">
            <Icon name="media" className="size-4 text-blue" />
            <span className="flex-1 text-sm">Media files</span>
            <span className="text-right">
              <span className="font-serif text-xl">{o?.media.n ?? "–"}</span>
              <span className="block text-[11px] text-muted">{o ? formatBytes(o.media.bytes) : ""}</span>
            </span>
          </Link>
        </div>
      </Panel>
    </>
  );
}
