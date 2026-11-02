"use client";

import { ArrowUpRight, Lightbulb, MessageCircleQuestion, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import { formatDate } from "@/lib/format";
import { SIMILAR_CASES, findStaff } from "@/lib/mock-data";
import type { SimilarCase, Thread } from "@/lib/types";
import { keepThreadInHistory, threadHref } from "./thread-link";

/** 지금 대화와 비슷한 과거 건. 유사도가 높은 것부터 */
export function similarCasesOf(thread: Thread) {
  return SIMILAR_CASES.filter((c) => thread.similarCaseIds?.includes(c.id)).sort((a, b) => b.match - a.match);
}

interface SimilarCasesPanelProps {
  thread: Thread;
  open: boolean;
  onClose: () => void;
  /** 이 과거 건을 참고해 답장 초안을 다시 쓴다 */
  onUseCase: (c: SimilarCase) => void;
  /** 처리한 사람과의 1:1 채팅으로 가서 물어본다 */
  onAsk: (c: SimilarCase) => void;
}

/**
 * 신규 문의에 비슷한 과거 건을 보여 주고, 그 건을 참고해 답장하게 돕는다 (기능정리 4-1, 4-2).
 * 무엇을 기준으로 찾았는지, 어디가 비슷한지, 당시 어떻게 해결했는지를 함께 보여 주고
 * 초안 쓰기·당시 대화·프로젝트·처리한 사람으로 바로 이어 준다.
 * 넓은 화면에서는 오른쪽에 고정, 좁은 화면에서는 open일 때 서랍으로 연다.
 */
export function SimilarCasesPanel({ thread, open, onClose, onUseCase, onAsk }: SimilarCasesPanelProps) {
  const { currentUser, accounts, projects } = useDemo();
  const cases = similarCasesOf(thread);
  const basis = thread.messages.find((m) => m.id === thread.similarBasis?.messageId);

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/20 xl:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4",
          open ? "fixed inset-y-0 right-0 z-40 shadow-xl xl:static xl:z-auto xl:shadow-none" : "hidden xl:block",
        )}
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Lightbulb className="size-4 text-amber-500" />
          비슷한 과거 건
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100 xl:hidden"
            aria-label="닫기"
          >
            <X className="size-4" />
          </button>
        </h3>
        {thread.similarBasis && (
          <div className="mt-2 mb-3 rounded-lg bg-slate-50 p-2.5 text-xs">
            <p className="font-medium text-slate-700">&ldquo;{thread.similarBasis.topic}&rdquo; 문의와 비슷한 건이에요</p>
            {basis && (
              <p className="mt-1 line-clamp-2 text-slate-500">
                {basis.authorName}: {basis.body}
              </p>
            )}
          </div>
        )}

        <ul className="space-y-3">
          {cases.map((c) => {
            const owner = findStaff(c.ownerId);
            const project = projects.find((p) => p.id === c.projectId);
            const account = accounts.find((a) => a.id === project?.accountId);
            return (
              <li key={c.id} className="space-y-2 rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{c.title}</p>
                  <Badge className="bg-emerald-50 text-emerald-700">유사 {c.match}%</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {account?.name} · {formatDate(c.date)} · 처리 {owner.name}
                </p>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="mr-0.5 text-xs text-slate-400">비슷한 점</span>
                  {c.matchedOn.map((m) => (
                    <Badge key={m} className="bg-slate-100 text-slate-600">
                      {m}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  <span className="font-medium text-slate-700">해결</span> {c.resolution}
                  {c.quote && ` · ${c.quote}`}
                </p>
                <p className="rounded-lg bg-amber-50 p-2 text-xs leading-relaxed text-amber-900">
                  <span className="font-medium">이렇게 답해 보세요</span> {c.advice}
                </p>
                <Button size="sm" variant="primary" className="w-full" onClick={() => onUseCase(c)}>
                  <Sparkles className="size-3.5" />이 방법으로 초안 쓰기
                </Button>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  <Link
                    href={threadHref(c.threadId, thread.id)}
                    onClick={() => keepThreadInHistory(thread.id)}
                    className="inline-flex items-center text-brand-600 hover:underline"
                  >
                    당시 대화
                    <ArrowUpRight className="size-3" />
                  </Link>
                  <Link
                    href={`/projects/${c.projectId}?from=${thread.id}`}
                    onClick={() => keepThreadInHistory(thread.id)}
                    className="inline-flex items-center text-brand-600 hover:underline"
                  >
                    {project?.name ?? "프로젝트"}
                    <ArrowUpRight className="size-3" />
                  </Link>
                  {owner.id !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => onAsk(c)}
                      className="inline-flex items-center gap-0.5 text-brand-600 hover:underline"
                    >
                      <MessageCircleQuestion className="size-3" />
                      {owner.name}님에게 물어보기
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
