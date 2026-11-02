"use client";

import { FolderKanban, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import { PERSONAL, messageTag } from "@/lib/thread";
import type { Message, Thread } from "@/lib/types";

/** 한 방에 연결한 프로젝트를 색으로 구분한다. 개인 대화는 회색 */
const TONES = ["bg-sky-50 text-sky-700", "bg-violet-50 text-violet-700", "bg-emerald-50 text-emerald-700", "bg-amber-50 text-amber-800"];

/**
 * 메시지 아래 작은 표시: 이 메시지가 어느 프로젝트에 쌓이는지, 개인 대화인지.
 * 받은 메시지는 AI가 붙이고, 틀리면 눌러서 바꾼다
 */
export function MessageTag({ thread, message }: { thread: Thread; message: Message }) {
  const { projects, tagMessage } = useDemo();
  const tag = messageTag(thread, message);
  // 연결한 프로젝트가 없는 방의 표시 없는 메시지는 아무 데도 쌓이지 않으니 보여 줄 것이 없다
  if (!tag) return null;

  const personal = tag === PERSONAL;
  const linked = thread.projectIds.map((id) => projects.find((p) => p.id === id)).filter((p) => p !== undefined);
  const Icon = personal ? Lock : FolderKanban;

  return (
    <span
      className={cn(
        "mt-1 inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs",
        personal ? "bg-slate-100 text-slate-500" : TONES[thread.projectIds.indexOf(tag) % TONES.length],
      )}
    >
      <Icon className="size-3 shrink-0" />
      {linked.length === 0 ? (
        "개인 대화"
      ) : (
        <select
          value={tag}
          onChange={(e) => tagMessage(thread.id, message.id, e.target.value)}
          aria-label="이 메시지가 쌓일 곳"
          title="눌러서 이 메시지가 쌓일 곳을 바꿀 수 있어요"
          className="min-w-0 cursor-pointer appearance-none truncate bg-transparent outline-none"
        >
          {linked.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          <option value={PERSONAL}>개인 대화</option>
        </select>
      )}
    </span>
  );
}
