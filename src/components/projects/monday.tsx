import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { daysUntil, formatDate } from "@/lib/format";
import { MONDAY_ITEMS } from "@/lib/mock-data";
import type { MondayColor, MondayItem, MondayTask } from "@/lib/types";

/** 스페이스와 연결된 먼데이 아이템. 연결이 없으면 undefined */
export function mondayOf(projectId: string) {
  return MONDAY_ITEMS.find((m) => m.projectId === projectId);
}

export function openTasks(item: MondayItem) {
  return item.tasks.filter((t) => t.status !== "완료");
}

/** 끝나지 않은 하위 아이템 중 가장 가까운 마감 */
export function nextDue(item: MondayItem) {
  return openTasks(item)
    .map((t) => t.due)
    .filter((d): d is string => Boolean(d))
    .sort()[0];
}

/** 하위 업무가 모두 끝났을 때 마지막 마감 (끝난 날로 본다) */
export function lastDue(item: MondayItem) {
  return item.tasks
    .map((t) => t.due)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);
}

/** 다음 마감이 있으면 D-n, 업무가 모두 끝났으면 마지막 마감일만 회색으로 */
export function NextDueCell({ item, className }: { item: MondayItem; className?: string }) {
  const due = nextDue(item);
  if (due) return <DueLabel iso={due} className={className} />;
  const last = lastDue(item);
  if (!last) return <span className="text-slate-300">-</span>;
  return <span className={cn("text-sm whitespace-nowrap text-slate-400", className)}>{formatDate(last)}</span>;
}

export function formatAmount(amount: number) {
  return `${amount.toLocaleString("ko-KR")}만원`;
}

/** 먼데이에서 받아온 값이라는 표시 */
export function MondayDot() {
  return <span className="inline-block size-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />;
}

const STAGE_COLOR: Record<MondayColor, string> = {
  blue: "bg-sky-100 text-sky-800",
  amber: "bg-amber-100 text-amber-800",
  violet: "bg-violet-100 text-violet-800",
  emerald: "bg-emerald-100 text-emerald-800",
  rose: "bg-rose-100 text-rose-800",
  slate: "bg-slate-200 text-slate-700",
};

export function StageBadge({ stage }: { stage: MondayItem["stage"] }) {
  return <Badge className={STAGE_COLOR[stage.color]}>{stage.label}</Badge>;
}

const PRIORITY_COLOR: Record<MondayItem["priority"], string> = {
  높음: "bg-rose-50 text-rose-700",
  보통: "bg-slate-100 text-slate-600",
  낮음: "bg-slate-50 text-slate-400",
};

export function PriorityBadge({ priority }: { priority: MondayItem["priority"] }) {
  return <Badge className={PRIORITY_COLOR[priority]}>{priority}</Badge>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`진행률 ${value}%`}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs tabular-nums text-slate-500">{value}%</span>
    </div>
  );
}

/** 11/14 D-16처럼. 하루 남았거나 오늘이면 주황, 지났으면 빨강 */
export function DueLabel({ iso, className }: { iso: string; className?: string }) {
  const date = new Date(iso);
  const left = daysUntil(iso);
  const tag = left < 0 ? `${-left}일 지남` : left === 0 ? "오늘" : `D-${left}`;
  return (
    <span className={cn("text-sm whitespace-nowrap", className)}>
      {date.getMonth() + 1}/{date.getDate()}{" "}
      <span
        className={cn(
          "text-xs",
          left < 0 ? "font-medium text-rose-600" : left <= 1 ? "font-medium text-amber-600" : "text-slate-400",
        )}
      >
        {tag}
      </span>
    </span>
  );
}

const TASK_DOT: Record<MondayTask["status"], string> = {
  완료: "bg-emerald-500",
  "진행 중": "bg-amber-500",
  막힘: "bg-rose-500",
  대기: "bg-slate-300",
};

export function TaskStatus({ status }: { status: MondayTask["status"] }) {
  return (
    <span className="inline-flex w-14 shrink-0 items-center gap-1.5 text-xs text-slate-600">
      <span className={cn("size-2 rounded-full", TASK_DOT[status])} />
      {status}
    </span>
  );
}
