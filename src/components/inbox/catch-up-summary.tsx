"use client";

import { ArrowUpRight, ChevronUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { CatchUpPoint } from "@/lib/types";

const KIND_COLOR: Record<CatchUpPoint["kind"], string> = {
  요청: "bg-rose-50 text-rose-700",
  "정해진 것": "bg-brand-50 text-brand-700",
  해결됨: "bg-emerald-50 text-emerald-700",
};

interface CatchUpSummaryProps {
  unread: number;
  points: CatchUpPoint[];
  /** 요약 한 줄의 근거 메시지로 이동 */
  onJump: (messageIds: string[]) => void;
}

/** 모든 대화를 미리 요약하지 않고, 안 읽은 메시지가 많을 때 눌러야 만든다 */
export function CatchUpSummary({ unread, points, onJump }: CatchUpSummaryProps) {
  const [state, setState] = useState<"idle" | "loading" | "open" | "folded">("idle");

  if (state !== "open") {
    return (
      <div className="flex items-center gap-2 border-b border-slate-200 bg-brand-50/50 px-6 py-2 text-sm">
        <Sparkles className="size-4 shrink-0 text-brand-600" />
        <span className="flex-1">안 읽은 메시지 {unread}개가 있어요.</span>
        <Button
          size="sm"
          disabled={state === "loading"}
          onClick={() => {
            if (state === "folded") return setState("open");
            setState("loading");
            setTimeout(() => setState("open"), 700);
          }}
        >
          {state === "loading" ? "요약하는 중…" : state === "folded" ? "요약 펼치기" : "요약 보기"}
        </Button>
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200 bg-brand-50/50 px-6 py-3">
      <div className="flex items-center gap-2 text-sm">
        <Sparkles className="size-4 shrink-0 text-brand-600" />
        <span className="font-medium">안 읽은 메시지 {unread}개 요약</span>
        <span className="hidden text-xs text-slate-400 sm:inline">AI 요약이에요. 중요한 건 원문으로 확인하세요.</span>
        <button
          type="button"
          onClick={() => setState("folded")}
          className="ml-auto rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-600"
          aria-label="요약 접기"
        >
          <ChevronUp className="size-4" />
        </button>
      </div>
      <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
        {points.map((p) => (
          <li key={p.messageIds[0]} className="flex items-start gap-2 text-sm">
            <Badge className={cn("mt-0.5 shrink-0", KIND_COLOR[p.kind])}>{p.kind}</Badge>
            <span className="flex-1 text-slate-700">{p.text}</span>
            <button
              type="button"
              onClick={() => onJump(p.messageIds)}
              className="inline-flex shrink-0 items-center text-xs font-medium text-brand-600 hover:underline"
            >
              원문
              <ArrowUpRight className="size-3" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
