"use client";

import { CircleQuestionMark, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import { isTyping } from "@/lib/keyboard";
import type { Role } from "@/lib/types";
import { PageGuide } from "./page-guide";
import { SearchPalette } from "./search-palette";

const ROLES: { value: Role; label: string }[] = [
  { value: "member", label: "담당자로 보기" },
  { value: "lead", label: "팀장으로 보기" },
];

export function Topbar() {
  const { role, setRole, currentUser } = useDemo();
  const [searching, setSearching] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  // Ctrl+K(맥은 ⌘K) 또는 입력 중이 아닐 때 "/"로 검색 열기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !isTyping(e.target))) {
        e.preventDefault();
        setSearching(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-6">
      <button
        type="button"
        onClick={() => setSearching(true)}
        className="flex h-9 max-w-md min-w-0 flex-1 items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm text-slate-400 hover:bg-slate-200/60"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">스페이스·고객사·대화·문서 검색</span>
        <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 text-xs text-slate-400 sm:inline">Ctrl K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm whitespace-nowrap text-slate-600 hover:bg-slate-100"
        >
          <CircleQuestionMark className="size-4" />
          <span className="hidden md:inline">화면 안내</span>
        </button>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
          {ROLES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={cn(
                "rounded-md px-2.5 py-1.5 whitespace-nowrap",
                role === value ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Avatar name={currentUser.name} />
          <div className="hidden leading-tight lg:block">
            <p className="text-sm font-medium whitespace-nowrap">{currentUser.name}</p>
            <p className="text-xs whitespace-nowrap text-slate-500">{currentUser.title}</p>
          </div>
        </div>
      </div>

      {searching && <SearchPalette onClose={() => setSearching(false)} />}
      <PageGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </header>
  );
}
