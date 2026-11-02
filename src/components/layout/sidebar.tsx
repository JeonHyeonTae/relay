"use client";

import { BookOpen, Building2, FolderKanban, Inbox, ListChecks, PanelLeftClose, PanelLeftOpen, Plug, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useDemo, visibleThreads } from "@/lib/demo-context";

const NAV = [
  { href: "/today", label: "오늘 할 일", icon: ListChecks },
  { href: "/inbox", label: "통합 수신함", icon: Inbox },
  { href: "/projects", label: "프로젝트", icon: FolderKanban },
  { href: "/clients", label: "고객사", icon: Building2 },
  { href: "/knowledge", label: "지식 베이스", icon: BookOpen },
  { href: "/channels", label: "채널 연동", icon: Plug },
  { href: "/settings", label: "설정", icon: Settings },
];

const COLLAPSED_KEY = "relay.sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const { threads, currentUser, role } = useDemo();
  const pending = visibleThreads(threads, currentUser, role).filter((t) => t.needsReply).length;
  const [collapsed, setCollapsed] = useState(false);

  // 접힘 상태는 브라우저에 기억해 둔다 (저장소를 못 쓰면 펼친 상태로 시작)
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {}
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {}
  };

  return (
    <aside className={cn("flex shrink-0 flex-col border-r border-slate-200 bg-white", collapsed ? "w-16" : "w-56")}>
      {/* 접기 버튼은 위쪽에 둔다. 아래쪽은 개발 서버의 Next.js 표시와 겹친다 */}
      <div className={cn("flex h-14 items-center gap-2 border-b border-slate-200", collapsed ? "justify-center" : "pr-3 pl-5")}>
        {!collapsed && (
          <>
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">R</span>
            <span className="flex-1 text-base font-semibold">Relay</span>
          </>
        )}
        <button
          type="button"
          onClick={toggle}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
          title={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const badge = href === "/inbox" && pending > 0 ? pending : null;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "relative flex items-center gap-2.5 rounded-lg py-2 text-sm",
                collapsed ? "justify-center px-0" : "px-3",
                active ? "bg-brand-50 font-medium text-brand-700" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="flex-1">{label}</span>}
              {badge !== null &&
                (collapsed ? (
                  <span className="absolute top-1 right-1.5 size-2 rounded-full bg-rose-500" aria-label={`답장 필요 ${badge}건`} />
                ) : (
                  <span className="rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">{badge}</span>
                ))}
            </Link>
          );
        })}
      </nav>
      {!collapsed && <p className="border-t border-slate-200 p-4 text-xs text-slate-400">데모 화면 · 실제 연동 없음</p>}
    </aside>
  );
}
