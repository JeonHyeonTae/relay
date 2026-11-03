"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { DocKind, KnowledgeDoc } from "@/lib/types";
import { DocTable } from "./doc-table";

type Sort = "recent" | "used";

interface DocListProps {
  docs: KnowledgeDoc[];
  onOpen: (docId: string) => void;
  showProject?: boolean;
  /** 처음에 보여 줄 개수. "더 보기"를 누를 때마다 이만큼 더 보인다 */
  pageSize?: number;
}

/**
 * 자료가 많아져도 화면이 끝없이 길어지지 않게: 종류로 거르고, 최근 순·자주 쓴 순으로 정렬하고,
 * 처음에는 pageSize개만 보인다. 자료가 몇 개 안 되면 거르기·정렬 없이 표만 보인다
 */
export function DocList({ docs, onOpen, showProject, pageSize = 10 }: DocListProps) {
  const [kind, setKind] = useState<DocKind | "all">("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [shown, setShown] = useState(pageSize);

  const kinds = Array.from(new Set(docs.map((d) => d.kind)));
  const filtered = docs
    .filter((d) => kind === "all" || d.kind === kind)
    .sort((a, b) => (sort === "used" ? b.usedCount - a.usedCount : 0) || b.updatedAt.localeCompare(a.updatedAt));
  const visible = filtered.slice(0, shown);
  const rest = filtered.length - visible.length;
  const pick = (next: DocKind | "all") => {
    setKind(next);
    setShown(pageSize);
  };

  return (
    <div className="space-y-2">
      {docs.length > 5 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <KindChip active={kind === "all"} onClick={() => pick("all")} label={`전체 ${docs.length}`} />
          {kinds.length > 1 &&
            kinds.map((k) => (
              <KindChip
                key={k}
                active={kind === k}
                onClick={() => pick(k)}
                label={`${k} ${docs.filter((d) => d.kind === k).length}`}
              />
            ))}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="정렬"
            className="ml-auto h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-brand-400"
          >
            <option value="recent">최근에 바뀐 순</option>
            <option value="used">답장에 자주 쓴 순</option>
          </select>
        </div>
      )}
      <DocTable docs={visible} onOpen={onOpen} showProject={showProject} />
      {rest > 0 && (
        <button
          type="button"
          onClick={() => setShown((n) => n + pageSize)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs text-slate-600 hover:bg-slate-50"
        >
          더 보기 ({rest}개 더)
        </button>
      )}
    </div>
  );
}

function KindChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs",
        active ? "border-brand-200 bg-brand-50 font-medium text-brand-700" : "border-slate-200 bg-white text-slate-500 hover:text-slate-700",
      )}
    >
      {label}
    </button>
  );
}
