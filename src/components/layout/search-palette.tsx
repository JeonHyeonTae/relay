"use client";

import { Building2, CornerDownLeft, FileText, FolderKanban, MessageSquare, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useDemo, visibleThreads } from "@/lib/demo-context";
import { docHref } from "@/lib/docs";
import { lastAt } from "@/lib/thread";
import type { Thread } from "@/lib/types";

interface Result {
  key: string;
  group: string;
  icon: ReactNode;
  title: string;
  sub: string;
  href: string;
}

const LIMIT = 5;

/** 프로젝트·고객사·대화·문서를 한 번에 찾는 검색 창 (Ctrl+K) */
export function SearchPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { accounts, projects, threads, docs, currentUser, role } = useDemo();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const hit = (...texts: (string | undefined)[]) => texts.some((t) => t?.toLowerCase().includes(q));
    const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "";
    const projectName = (id?: string) => projects.find((p) => p.id === id)?.name ?? "";
    const visible = visibleThreads(threads, currentUser, role).sort((a, b) => lastAt(b) - lastAt(a));
    const threadResult = (group: string) => (t: Thread) => ({
      key: `t-${t.id}`,
      group,
      icon: <MessageSquare className="size-4" />,
      title: t.title,
      sub: [accountName(t.accountId), ...t.projectIds.map(projectName)].join(" · "),
      href: `/inbox?thread=${t.id}`,
    });

    // 검색어가 없으면 답장할 건부터 보여준다
    if (!q) return visible.filter((t) => t.needsReply).slice(0, LIMIT).map(threadResult("답장 필요"));

    return [
      ...accounts
        .filter((a) => hit(a.name, a.industry, ...a.contacts.map((c) => c.name)))
        .slice(0, LIMIT)
        .map((a) => ({
          key: `a-${a.id}`,
          group: "고객사",
          icon: <Building2 className="size-4" />,
          title: a.name,
          sub: a.industry,
          href: `/clients/${a.id}`,
        })),
      ...projects
        .filter((p) => hit(p.name, accountName(p.accountId)))
        .slice(0, LIMIT)
        .map((p) => ({
          key: `p-${p.id}`,
          group: "프로젝트",
          icon: <FolderKanban className="size-4" />,
          title: p.name,
          sub: `${accountName(p.accountId)} · ${p.status}`,
          href: `/projects/${p.id}`,
        })),
      ...visible
        .filter((t) => hit(t.title, ...t.messages.flatMap((m) => [m.body, m.authorName])))
        .slice(0, LIMIT)
        .map(threadResult("대화")),
      ...docs
        .filter((d) => hit(d.title, d.summary, d.kind))
        .slice(0, LIMIT)
        .map((d) => ({
          key: `d-${d.id}`,
          group: "문서",
          icon: <FileText className="size-4" />,
          title: d.title,
          sub: `${d.projectId ? projectName(d.projectId) : "회사 공통"} · ${d.kind}`,
          href: docHref(d),
        })),
    ];
  }, [query, accounts, projects, threads, docs, currentUser, role]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (result: Result | undefined) => {
    if (!result) return;
    router.push(result.href);
    onClose();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh]" onMouseDown={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="size-4 shrink-0 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="회사, 프로젝트, 대화 내용, 문서 이름으로 검색"
            className="h-12 flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-400">Esc</kbd>
        </div>

        {results.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            {query.trim() ? `"${query.trim()}"에 맞는 결과가 없어요.` : "답장할 대화가 없어요."}
          </p>
        ) : (
          <ul ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {results.map((r, i) => (
              <li key={r.key}>
                {r.group !== results[i - 1]?.group && (
                  <p className="px-2 pt-2 pb-1 text-xs font-semibold text-slate-400">{r.group}</p>
                )}
                <button
                  type="button"
                  data-index={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left",
                    i === active ? "bg-brand-50 text-brand-700" : "text-slate-700",
                  )}
                >
                  <span className={cn("shrink-0", i === active ? "text-brand-600" : "text-slate-400")}>{r.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.title}</span>
                    <span className="block truncate text-xs text-slate-500">{r.sub}</span>
                  </span>
                  {i === active && <CornerDownLeft className="size-3.5 shrink-0 text-brand-400" />}
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="flex gap-4 border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
          <span>↑↓ 이동</span>
          <span>Enter 열기</span>
          <span>Esc 닫기</span>
        </p>
      </div>
    </div>
  );
}
