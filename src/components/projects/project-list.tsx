"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/common/page-header";
import { ProjectStatusBadge } from "@/components/common/project-status-badge";
import { Button } from "@/components/ui/button";
import { ColumnPicker, useStoredColumns } from "@/components/ui/column-picker";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import { formatDateTime } from "@/lib/format";
import { MONDAY_SYNCED_AT, PROJECT_FACTS, findStaff } from "@/lib/mock-data";
import type { Project } from "@/lib/types";
import {
  MondayDot,
  NextDueCell,
  PriorityBadge,
  ProgressBar,
  StageBadge,
  formatAmount,
  mondayOf,
  openTasks,
} from "./monday";
import { NewProjectDialog } from "./new-project-dialog";

type Scope = "all" | "mine";

type ColumnKey =
  | "status"
  | "partner"
  | "stage"
  | "progress"
  | "due"
  | "priority"
  | "taskOwner"
  | "amount"
  | "tasks"
  | "members"
  | "docs"
  | "facts";

/** monday: 먼데이에서 받아오는 칼럼. 기본으로 보이는 칼럼은 적게 두고 나머지는 칼럼 설정에서 켠다 */
const COLUMNS: { key: ColumnKey; label: string; monday?: boolean; shown: boolean }[] = [
  { key: "status", label: "상태", shown: true },
  { key: "partner", label: "고객사", shown: true },
  { key: "stage", label: "진행 단계", monday: true, shown: true },
  { key: "progress", label: "진행률", monday: true, shown: true },
  { key: "due", label: "다음 마감", monday: true, shown: true },
  { key: "priority", label: "우선순위", monday: true, shown: false },
  { key: "taskOwner", label: "업무 담당자", monday: true, shown: false },
  { key: "amount", label: "예상 금액", monday: true, shown: false },
  { key: "tasks", label: "남은 업무", monday: true, shown: false },
  { key: "members", label: "참여자", shown: true },
  { key: "docs", label: "문서", shown: false },
  { key: "facts", label: "핵심 정보", shown: false },
];

const COLUMN_KEYS = COLUMNS.map((c) => c.key);
const DEFAULT_COLUMNS = COLUMNS.filter((c) => c.shown).map((c) => c.key);

const empty = <span className="text-slate-300">-</span>;

export function ProjectList() {
  const router = useRouter();
  const { accounts, projects, docs, currentUser } = useDemo();
  const [creating, setCreating] = useState(false);
  const [scope, setScope] = useState<Scope>("all");
  const [query, setQuery] = useState("");
  const [shown, toggleColumn] = useStoredColumns("relay.project-columns", COLUMN_KEYS, DEFAULT_COLUMNS);

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "";
  const mine = projects.filter((p) => p.memberIds.includes(currentUser.id));
  const scopes: { value: Scope; label: string; count: number }[] = [
    { value: "all", label: "전체", count: projects.length },
    { value: "mine", label: "내 스페이스", count: mine.length },
  ];
  // 스페이스 이름이나 고객사 이름으로 찾는다
  const q = query.trim().toLowerCase();
  const list = (scope === "mine" ? mine : projects).filter(
    (p) => !q || [p.name, accountName(p.accountId)].some((t) => t.toLowerCase().includes(q)),
  );
  const columns = COLUMNS.filter((c) => shown.includes(c.key));

  const cell = (key: ColumnKey, project: Project): ReactNode => {
    const monday = mondayOf(project.id);
    switch (key) {
      case "status":
        return <ProjectStatusBadge status={project.status} />;
      case "partner":
        return (
          <Link
            href={`/clients/${project.accountId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-slate-500 hover:text-brand-600"
          >
            {accountName(project.accountId)}
          </Link>
        );
      case "stage":
        return monday ? <StageBadge stage={monday.stage} /> : empty;
      case "progress":
        return monday ? <ProgressBar value={monday.progress} /> : empty;
      case "due":
        return monday ? <NextDueCell item={monday} /> : empty;
      case "priority":
        return monday ? <PriorityBadge priority={monday.priority} /> : empty;
      case "taskOwner":
        return monday ? <span className="text-slate-600">{findStaff(monday.ownerId).name}</span> : empty;
      case "amount":
        return monday?.amount ? <span className="tabular-nums text-slate-600">{formatAmount(monday.amount)}</span> : empty;
      case "tasks":
        return monday ? <span className="text-slate-500">{openTasks(monday).length}건</span> : empty;
      case "members":
        return (
          <span className="text-slate-500" title={project.memberIds.map((m) => findStaff(m).name).join(", ")}>
            {project.memberIds.length}명
          </span>
        );
      case "docs":
        return <span className="text-slate-500">{docs.filter((d) => d.projectId === project.id).length}개</span>;
      case "facts":
        return <span className="text-slate-500">{PROJECT_FACTS.filter((f) => f.projectId === project.id).length}개</span>;
    }
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="스페이스"
        description="스페이스마다 문서·핵심 정보·소통 내역이 쌓이고, AI는 이 자산을 근거로 답장을 만듭니다."
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus className="size-4" />새 스페이스
          </Button>
        }
      />

      <div className="mx-8 mb-3 flex flex-wrap items-center gap-2">
        {scopes.map(({ value, label, count }) => (
          <button
            key={value}
            type="button"
            onClick={() => setScope(value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs whitespace-nowrap",
              scope === value ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
            )}
          >
            {label}
            <span className={cn("ml-1 tabular-nums", scope === value ? "text-slate-300" : "text-slate-400")}>{count}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="스페이스·고객사 이름 검색" />
          <ColumnPicker
            columns={COLUMNS.map((c) => ({ ...c, hint: c.monday && <MondayDot /> }))}
            shown={shown}
            onToggle={toggleColumn}
            legend={
              <span className="flex items-center gap-1.5">
                <MondayDot />
                먼데이에서 받아온 칼럼
              </span>
            }
          />
        </div>
      </div>

      {list.length === 0 ? (
        <p className="mx-8 rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
          {q ? "검색에 맞는 스페이스가 없어요." : "참여 중인 스페이스가 없어요. 전체에서 찾아보세요."}
        </p>
      ) : (
        <div className="mx-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs whitespace-nowrap text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">스페이스</th>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-2.5 font-medium" title={c.monday ? "먼데이에서 받아온 칼럼" : undefined}>
                    <span className="inline-flex items-center gap-1.5">
                      {c.monday && <MondayDot />}
                      {c.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => router.push(`/spaces/${project.id}`)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/spaces/${project.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium hover:text-brand-600"
                    >
                      {project.name}
                    </Link>
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 whitespace-nowrap">
                      {cell(c.key, project)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mx-8 mt-2 flex items-center gap-1.5 text-xs text-slate-400">
        <MondayDot />
        먼데이에서 받아온 칼럼이에요 · {formatDateTime(MONDAY_SYNCED_AT)} 동기화
      </p>

      <NewProjectDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
