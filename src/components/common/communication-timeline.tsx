"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useDemo } from "@/lib/demo-context";
import { formatDateTime } from "@/lib/format";
import { PERSONAL, messageTag, roomName } from "@/lib/thread";
import type { Thread } from "@/lib/types";
import { ChannelBadge } from "./channel-badge";

/**
 * 여러 대화의 메시지를 시간순 하나의 타임라인으로 보여줌. projectId를 주면 그 프로젝트로 쌓인 메시지만.
 * 개인 대화로 표시한 메시지와 연결하지 않은 채팅방의 메시지는 쌓이지 않아 보이지 않는다
 */
export function CommunicationTimeline({ threads, projectId }: { threads: Thread[]; projectId?: string }) {
  const { projects, currentUser } = useDemo();

  const items = threads
    .flatMap((t) =>
      t.messages
        .map((m) => ({ thread: t, message: m, tag: messageTag(t, m) }))
        .filter(({ tag }) => (projectId ? tag === projectId : tag && tag !== PERSONAL)),
    )
    .sort((a, b) => new Date(b.message.at).getTime() - new Date(a.message.at).getTime());

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">소통 내역이 없어요.</p>;
  }

  return (
    <ol className="relative space-y-5 border-l border-slate-200 pl-5">
      {items.map(({ thread, message, tag }) => (
        <li key={message.id} className="relative">
          <span className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full border-2 border-white bg-brand-400" />
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <ChannelBadge channel={thread.channel} />
            <span className="font-medium text-slate-700">{message.authorName}</span>
            <span>{formatDateTime(message.at)}</span>
            {!projectId && (
              <>
                <span className="text-slate-300">·</span>
                <span>{projects.find((p) => p.id === tag)?.name}</span>
              </>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-slate-700">{message.body}</p>
          {/* 채팅방이 아니라 이 메시지가 있는 곳으로 바로 간다 */}
          <Link
            href={`/inbox?thread=${thread.id}&msg=${message.id}`}
            className="mt-1 inline-flex items-center text-xs text-brand-600 hover:underline"
          >
            {roomName(thread, currentUser.id)} 대화에서 보기
            <ChevronRight className="size-3" />
          </Link>
        </li>
      ))}
    </ol>
  );
}
