"use client";

import { ChevronDown, Copy, FileText, MessageSquare, RotateCcw, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import { docHref } from "@/lib/docs";
import { PERSONAL, defaultTag, genericDraft, roomName } from "@/lib/thread";
import { keepThreadInHistory, threadHref } from "./thread-link";
import type { DraftSource, Thread } from "@/lib/types";

/** 비슷한 과거 건 등을 참고해 다시 쓴 초안 */
export interface DraftSuggestion {
  key: string;
  text: string;
  sources: DraftSource[];
}

/** 초안 생성 → 사람이 확인·수정 → 승인 후 발송 (기능정리 2-2, 2-4, 2-5, 2-6).
    AI 초안이 있든 없든 같은 입력칸을 쓰고, 초안이 있으면 위에 한 줄만 붙인다.
    aiOn이 꺼진 채팅방은 AI 초안 없이 직접 쓴다.
    보낼 때마다 이 메시지를 어느 프로젝트 대화로 쌓을지, 개인 대화로 쌓지 않을지 고른다 */
export function DraftReply({ thread, aiOn, suggestion }: { thread: Thread; aiOn: boolean; suggestion?: DraftSuggestion }) {
  const { sendReply, notify, docs, threads, projects, channelAccounts, currentUser, logActivity, sendModeOf, prefs } = useDemo();
  // 사용자가 고른 과거 건 초안이 먼저, 없으면 AI가 미리 써 둔 초안
  const aiBase =
    suggestion ?? (aiOn && thread.aiDraft ? { text: thread.aiDraft, sources: thread.draftSources ?? [] } : null);
  const [base, setBase] = useState<string | null>(aiBase?.text ?? null);
  const [text, setText] = useState(aiBase?.text ?? "");
  const [showSources, setShowSources] = useState(false);
  // 처음에는 마지막 메시지가 쌓인 곳. 보낸 뒤에도 그대로 둬서 같은 얘기를 이어 쓰기 쉽게
  const [tag, setTag] = useState(() => defaultTag(thread));
  const linked = thread.projectIds.map((id) => projects.find((p) => p.id === id)).filter((p) => p !== undefined);
  const personal = tag === PERSONAL;
  const via = channelAccounts.find((a) => a.id === thread.via);
  const mode = sendModeOf(thread.channel);
  const signature = prefs.signature.trim();
  const edited = base !== null && text.trim() !== base.trim();
  // 근거는 AI가 만든 원래 초안에만 붙는다. 일반 안내 문구에는 근거가 없다.
  const sources = base !== null && base === aiBase?.text ? aiBase.sources : [];

  if (mode === "receive") {
    return <p className="text-center text-xs text-slate-400">대화 파일로 가져온 대화예요. 답장은 원래 메신저에서 보내 주세요.</p>;
  }

  const send = () => {
    if (!text.trim()) return;
    // 내 설정의 서명은 보낼 때 끝에 붙인다
    sendReply(thread.id, signature ? `${text.trim()}\n\n${signature}` : text.trim(), edited, tag);
    const where = personal ? "개인 대화" : projects.find((p) => p.id === tag)?.name;
    logActivity(`'${roomName(thread, currentUser.id)}'에 답장 ${mode === "draft" ? "보낸 것으로 표시" : "발송"} (${where})`);
    setBase(null);
    setText("");
  };

  // 자동 발송 채널은 Ctrl+Enter(맥은 ⌘+Enter)로 바로 보낸다
  const sendOnShortcut = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mode === "auto" && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  const copy = async () => {
    await navigator.clipboard?.writeText(text);
    notify(`복사했어요. ${via ? via.address : "원래 채널"}에서 붙여 넣어 보내 주세요.`);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
      {base !== null && (
        <div className="border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <Sparkles className="size-3.5 text-brand-600" />
            <span className="text-xs font-medium text-slate-700">AI 초안</span>
            {sources.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowSources((v) => !v)}
                aria-expanded={showSources}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 hover:text-brand-700"
              >
                근거 {sources.length}건
                <ChevronDown className={cn("size-3 transition-transform", showSources && "rotate-180")} />
              </button>
            ) : (
              <Badge className="bg-slate-100 text-slate-400">근거 없음 · 일반 안내 문구</Badge>
            )}
            {edited && (
              <Badge className="bg-amber-100 text-amber-800">{personal ? "수정됨" : "수정됨 · 학습 데이터로 저장"}</Badge>
            )}
          </div>
          {showSources && sources.length > 0 && (
            <ul className="space-y-1 px-3 pb-2">
              {sources.map((s) => {
                const doc = docs.find((d) => d.id === s.docId);
                const ref = threads.find((t) => t.id === s.threadId);
                return (
                  <li key={s.docId ?? s.threadId} className="flex min-w-0 items-center gap-1.5 text-xs">
                    {doc ? (
                      <FileText className="size-3.5 shrink-0 text-slate-400" />
                    ) : (
                      <MessageSquare className="size-3.5 shrink-0 text-slate-400" />
                    )}
                    {doc && (
                      <Link href={docHref(doc)} className="shrink-0 font-medium text-brand-700 hover:underline">
                        {doc.title}
                      </Link>
                    )}
                    {ref && (
                      <Link
                        href={threadHref(ref.id, thread.id)}
                        onClick={() => keepThreadInHistory(thread.id)}
                        className="shrink-0 font-medium text-brand-700 hover:underline"
                      >
                        {ref.title}
                      </Link>
                    )}
                    <span className="truncate text-slate-500">— {s.note}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={sendOnShortcut}
        rows={3}
        placeholder="답장 쓰기"
        className="block w-full resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none"
      />
      <div className="flex flex-wrap items-center gap-2 px-3 pb-2.5">
        {linked.length > 0 ? (
          <label className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
            <span className="shrink-0">쌓을 곳</span>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className={cn(
                "h-7 max-w-52 min-w-0 truncate rounded-md border px-2 text-xs outline-none focus:border-brand-400",
                personal ? "border-slate-200 bg-slate-100 text-slate-600" : "border-slate-200 bg-white text-slate-700",
              )}
            >
              {linked.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value={PERSONAL}>개인 대화 · 쌓지 않음</option>
            </select>
          </label>
        ) : (
          <span className="text-xs text-slate-400">연결한 프로젝트가 없어 개인 대화로 남아요</span>
        )}
        {mode === "draft" ? (
          <span className="min-w-0 text-xs text-slate-500">
            초안만 되는 채널이에요. 복사해서 {via ? `${via.address}에서` : ""} 보내 주세요.
          </span>
        ) : (
          <span className="hidden text-xs text-slate-400 2xl:inline">
            Ctrl + Enter로 발송{signature && " · 보낼 때 서명이 붙어요"}
          </span>
        )}
        <div className="ml-auto flex shrink-0 gap-2">
          {base !== null ? (
            <Button variant="ghost" size="sm" onClick={() => setText(base)} disabled={!edited}>
              <RotateCcw className="size-3.5" />
              원래 초안
            </Button>
          ) : (
            aiOn && (
              <Button
                size="sm"
                onClick={() => {
                  const draft = genericDraft(thread, currentUser.id);
                  setBase(draft);
                  setText(draft);
                }}
              >
                <Sparkles className="size-3.5" />
                AI 초안
              </Button>
            )
          )}
          {mode === "draft" ? (
            <>
              <Button size="sm" onClick={copy} disabled={!text.trim()}>
                <Copy className="size-3.5" />
                복사
              </Button>
              <Button size="sm" variant="primary" onClick={send} disabled={!text.trim()}>
                보낸 것으로 표시
              </Button>
            </>
          ) : (
            <Button size="sm" variant="primary" onClick={send} disabled={!text.trim()}>
              <Send className="size-3.5" />
              {base !== null ? "승인 후 발송" : "보내기"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
