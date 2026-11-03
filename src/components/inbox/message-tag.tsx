"use client";

import { ChevronDown, FolderKanban, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import { PERSONAL, messageTags } from "@/lib/thread";
import type { Message, Thread } from "@/lib/types";
import { TagMenu, tagTone, useTagOptions } from "./tag-picker";

/**
 * 메시지 아래 작은 표시: 이 메시지가 어느 프로젝트에 쌓이는지(여러 곳일 수 있음), 개인 대화인지.
 * 받은 메시지는 AI가 붙이고, 틀리면 눌러서 바꾼다
 */
export function MessageTag({ thread, message }: { thread: Thread; message: Message }) {
  const { currentUser, tagMessage } = useDemo();
  const options = useTagOptions(thread);
  const tags = messageTags(thread, message);
  // 연결한 프로젝트가 없는 방의 표시 없는 메시지는 아무 데도 쌓이지 않으니 보여 줄 것이 없다
  if (tags.length === 0) return null;

  // 연결한 프로젝트 순서대로 보여 준다
  const shown = options.filter((o) => tags.includes(o.id));
  const chips = (
    <span className="flex flex-wrap items-center gap-1">
      {shown.map((o) => {
        const Icon = o.id === PERSONAL ? Lock : FolderKanban;
        return (
          <span
            key={o.id}
            className={cn("inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs", tagTone(thread, o.id))}
          >
            <Icon className="size-3 shrink-0" />
            <span className="truncate">{o.label}</span>
          </span>
        );
      })}
    </span>
  );

  // 연결한 프로젝트가 없는 방이면 바꿀 곳이 없다
  if (thread.projectIds.length === 0) return <div className="mt-1">{chips}</div>;

  return (
    <div className="mt-1 max-w-full">
      <TagMenu
        thread={thread}
        tags={tags}
        onChange={(next) => tagMessage(thread.id, message.id, next)}
        label="이 메시지가 쌓일 곳"
        align={message.authorId === currentUser.id ? "right" : "left"}
      >
        <span className="flex items-center gap-0.5">
          {chips}
          <ChevronDown className="size-3 shrink-0 text-slate-400" />
        </span>
      </TagMenu>
    </div>
  );
}
