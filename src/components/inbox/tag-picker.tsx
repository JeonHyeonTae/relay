"use client";

import { Check, Lock } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import { PERSONAL, toggleTag } from "@/lib/thread";
import type { Thread } from "@/lib/types";

/** 한 방에 연결한 스페이스를 색으로 구분한다. 개인 대화는 회색 */
const TONES = ["bg-sky-50 text-sky-700", "bg-violet-50 text-violet-700", "bg-emerald-50 text-emerald-700", "bg-amber-50 text-amber-800"];
const DOTS = ["bg-sky-400", "bg-violet-400", "bg-emerald-400", "bg-amber-400"];

export function tagTone(thread: Thread, tag: string) {
  return tag === PERSONAL ? "bg-slate-100 text-slate-500" : TONES[thread.projectIds.indexOf(tag) % TONES.length];
}

/** 쌓을 곳 후보: 방에 연결한 스페이스, 그리고 개인 대화 */
export function useTagOptions(thread: Thread) {
  const { projects } = useDemo();
  const linked = thread.projectIds.map((id) => projects.find((p) => p.id === id)).filter((p) => p !== undefined);
  return [...linked.map((p) => ({ id: p.id, label: p.name })), { id: PERSONAL, label: "개인 대화" }];
}

interface PickerProps {
  thread: Thread;
  tags: string[];
  onChange: (tags: string[]) => void;
}

/**
 * 쌓을 곳을 칩으로 켜고 끈다. 한 메시지에 여러 스페이스 얘기가 있으면 여러 개를 켠다.
 * 개인 대화는 스페이스와 함께 고를 수 없다
 */
export function TagToggles({ thread, tags, onChange }: PickerProps) {
  const options = useTagOptions(thread);
  return (
    <div role="group" aria-label="쌓을 곳" className="flex min-w-0 flex-wrap items-center gap-1">
      {options.map((o) => {
        const on = tags.includes(o.id);
        const personal = o.id === PERSONAL;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(toggleTag(tags, o.id))}
            title={personal ? "스페이스에 쌓지 않고 AI 학습에도 쓰지 않아요" : "다른 스페이스와 함께 고를 수 있어요"}
            className={cn(
              "inline-flex h-7 max-w-48 items-center gap-1 rounded-full border px-2.5 text-xs transition-colors",
              on
                ? cn("border-transparent font-medium", tagTone(thread, o.id))
                : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600",
            )}
          >
            {personal ? <Lock className="size-3 shrink-0" /> : on && <Check className="size-3 shrink-0" />}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** 쌓을 곳 고르기 메뉴. 메시지 아래 표시와, 연결한 스페이스가 많은 방의 입력칸에서 연다 */
export function TagMenu({
  thread,
  tags,
  onChange,
  label,
  align = "left",
  side = "bottom",
  children,
}: PickerProps & { label: string; align?: "left" | "right"; side?: "top" | "bottom"; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = useTagOptions(thread);

  // 바깥을 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative max-w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={label}
        title="눌러서 쌓일 곳을 바꿀 수 있어요"
        className="max-w-full text-left"
      >
        {children}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-20 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg",
            align === "right" ? "right-0" : "left-0",
            side === "top" ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          <p className="px-2 pt-1 pb-1.5 text-xs text-slate-500">여러 스페이스에 함께 쌓을 수 있어요</p>
          {options.map((o, i) => {
            const on = tags.includes(o.id);
            const personal = o.id === PERSONAL;
            return (
              <button
                key={o.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={on}
                onClick={() => onChange(toggleTag(tags, o.id))}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50",
                  personal && "mt-1 border-t border-slate-100 pt-2",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border",
                    on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300",
                  )}
                >
                  {on && <Check className="size-3" />}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {o.label}
                  {personal && <span className="ml-1 text-xs text-slate-400">· 쌓지 않음</span>}
                </span>
                {personal ? (
                  <Lock className="size-3.5 shrink-0 text-slate-400" />
                ) : (
                  <span className={cn("size-2 shrink-0 rounded-full", DOTS[i % DOTS.length])} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
