"use client";

import { Building2, ChevronRight, FolderKanban, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import type { Project } from "@/lib/types";

/** 지식이 쌓이는 범위. AI가 답장할 때 찾아보는 범위도 이 구조를 따른다 */
export type Scope = { kind: "company" } | { kind: "account"; id: string } | { kind: "project"; id: string };

const STATUS_ORDER: Record<Project["status"], number> = { "진행 중": 0, 대기: 1, 완료: 2 };

/**
 * 왼쪽 트리: 우리 회사(공통) → 고객사 → 스페이스.
 * 진행 중인 스페이스가 없는 회사는 접어 둔다
 */
export function KnowledgeTree({ scope, onSelect }: { scope: Scope; onSelect: (scope: Scope) => void }) {
  const { accounts, projects, docs } = useDemo();
  const projectsOf = (accountId: string) =>
    projects.filter((p) => p.accountId === accountId).sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const [collapsed, setCollapsed] = useState<string[]>(() =>
    accounts.filter((a) => projectsOf(a.id).every((p) => p.status === "완료")).map((a) => a.id),
  );
  const toggle = (id: string) => setCollapsed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const select = (next: Scope) => {
    // 접힌 회사의 스페이스를 고르면 그 회사를 편다
    const accountId =
      next.kind === "account" ? next.id : next.kind === "project" ? projects.find((p) => p.id === next.id)?.accountId : undefined;
    if (accountId) setCollapsed((prev) => prev.filter((x) => x !== accountId));
    onSelect(next);
  };


  return (
    <nav aria-label="지식 구조" className="rounded-xl border border-slate-200 bg-white p-2 text-sm">
      <Row
        icon={Building2}
        label="우리 회사"
        hint="공통"
        count={docs.filter((d) => !d.projectId && !d.accountId).length}
        active={scope.kind === "company"}
        onClick={() => select({ kind: "company" })}
      />
      <div className="mt-3">
        <p className="flex items-center gap-1.5 px-2 pb-1 text-xs font-medium text-slate-400">
          <Building2 className="size-3.5" />
          고객사 {accounts.length}
        </p>
        {accounts.map((a) => {
          const list = projectsOf(a.id);
          const open = !collapsed.includes(a.id);
          return (
            <div key={a.id}>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => toggle(a.id)}
                  aria-expanded={open}
                  aria-label={`${a.name} ${open ? "접기" : "펴기"}`}
                  className="flex size-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100"
                >
                  <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
                </button>
                <Row
                  label={a.name}
                  count={docs.filter((d) => d.accountId === a.id || list.some((p) => p.id === d.projectId)).length}
                  active={scope.kind === "account" && scope.id === a.id}
                  onClick={() => select({ kind: "account", id: a.id })}
                />
              </div>
              {open && (
                <ul className="mb-1 ml-3 border-l border-slate-100 pl-2">
                  {list.map((p) => (
                    <li key={p.id}>
                      <Row
                        icon={FolderKanban}
                        label={p.name}
                        muted={p.status === "완료"}
                        count={docs.filter((d) => d.projectId === p.id).length}
                        active={scope.kind === "project" && scope.id === p.id}
                        onClick={() => select({ kind: "project", id: p.id })}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  count,
  active,
  muted,
  onClick,
}: {
  icon?: LucideIcon;
  label: string;
  hint?: string;
  count: number;
  active: boolean;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full min-w-0 flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-left",
        active ? "bg-brand-50 font-medium text-brand-700" : muted ? "text-slate-400 hover:bg-slate-50" : "text-slate-700 hover:bg-slate-50",
      )}
    >
      {Icon && <Icon className="size-3.5 shrink-0 opacity-70" />}
      <span className="truncate">{label}</span>
      {hint && <span className="shrink-0 text-xs font-normal text-slate-400">{hint}</span>}
      <span className="ml-auto shrink-0 pl-1 text-xs font-normal text-slate-400">{count}</span>
    </button>
  );
}
