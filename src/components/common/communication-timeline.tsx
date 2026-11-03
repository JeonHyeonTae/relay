"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { useDemo } from "@/lib/demo-context";
import { formatDateTime } from "@/lib/format";
import { PERSONAL, messageTags, roomName } from "@/lib/thread";
import type { Thread } from "@/lib/types";
import { ChannelBadge } from "./channel-badge";

/**
 * 여러 대화의 메시지를 시간순 하나의 타임라인으로 보여줌. projectId를 주면 그 스페이스로 쌓인 메시지만.
 * 여러 스페이스에 함께 쌓인 메시지는 각 스페이스에 모두 보이고, 함께 쌓인 다른 스페이스를 작게 알려 준다.
 * 개인 대화로 표시한 메시지와 연결하지 않은 채팅방의 메시지는 쌓이지 않아 보이지 않는다
 */
export function CommunicationTimeline({ threads, projectId }: { threads: Thread[]; projectId?: string }) {
  const { projects, currentUser } = useDemo();

  const items = threads
    .flatMap((t) =>
      t.messages
        .map((m) => ({ thread: t, message: m, tags: messageTags(t, m) }))
        .filter(({ tags }) => (projectId ? tags.includes(projectId) : tags.length > 0 && !tags.includes(PERSONAL))),
    )
    .sort((a, b) => new Date(b.message.at).getTime() - new Date(a.message.at).getTime());

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">소통 내역이 없어요.</p>;
  }

  return (
    <ol className="relative space-y-5 border-l border-slate-200 pl-5">
      {items.map(({ thread, message, tags }) => {
        // 이 스페이스 말고 함께 쌓인 스페이스
        const others = tags
          .filter((id) => id !== projectId)
          .map((id) => projects.find((p) => p.id === id))
          .filter((p) => p !== undefined);
        return (
          <li key={message.id} className="relative">
            <span className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full border-2 border-white bg-brand-400" />
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <ChannelBadge channel={thread.channel} />
              <span className="font-medium text-slate-700">{message.authorName}</span>
              <span>{formatDateTime(message.at)}</span>
              {others.length > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  {projectId ? (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
                      {others.map((p, i) => (
                        <Fragment key={p.id}>
                          {i > 0 && ", "}
                          <Link href={`/spaces/${p.id}`} className="hover:text-brand-700 hover:underline">
                            {p.name}
                          </Link>
                        </Fragment>
                      ))}
                      에도 함께 쌓임
                    </span>
                  ) : (
                    <span>{others.map((p) => p.name).join(", ")}</span>
                  )}
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
        );
      })}
    </ol>
  );
}
