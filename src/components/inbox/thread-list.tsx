"use client";

import { Users } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { ChannelBadge } from "@/components/common/channel-badge";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import { formatTime } from "@/lib/format";
import { lastMessage, roomName } from "@/lib/thread";
import type { Thread } from "@/lib/types";

interface ThreadListProps {
  threads: Thread[];
  selectedId?: string;
  onSelect: (id: string) => void;
  /** 줄 오른쪽 끝에 붙일 것 (스페이스 채팅방 탭의 연결 끊기 등) */
  trailing?: (thread: Thread) => ReactNode;
}

/** 메신저 채팅 목록처럼 채널, 채팅방 이름, 인원, 시간, 안 읽은 수, 마지막 메시지만 보여 준다 */
export function ThreadList({ threads, selectedId, onSelect, trailing }: ThreadListProps) {
  const { currentUser } = useDemo();
  const listRef = useRef<HTMLUListElement>(null);

  // 키보드로 넘길 때 선택한 대화가 목록 밖으로 나가지 않게
  useEffect(() => {
    listRef.current?.querySelector(`[data-thread-id="${selectedId}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  return (
    <ul ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
      {threads.map((thread) => {
        const last = lastMessage(thread);
        const at = last?.at ?? thread.startedAt;
        const unread = thread.unread ?? 0;

        return (
          <li key={thread.id} className={cn(trailing && "flex border-b border-slate-100")}>
            <button
              type="button"
              data-thread-id={thread.id}
              onClick={() => onSelect(thread.id)}
              className={cn(
                "w-full min-w-0 space-y-1 px-4 py-3 text-left",
                !trailing && "border-b border-slate-100",
                thread.id === selectedId ? "bg-brand-50/70" : "hover:bg-slate-50",
              )}
            >
              <div className="flex items-center gap-2">
                <ChannelBadge channel={thread.channel} />
                <span className="truncate text-sm font-semibold">{roomName(thread, currentUser.id)}</span>
                {thread.group && (
                  <span
                    className="flex shrink-0 items-center gap-0.5 text-xs text-slate-400"
                    title={thread.group.members.join(", ")}
                    aria-label={`참여자 ${thread.group.members.length}명`}
                  >
                    <Users className="size-3" />
                    {thread.group.members.length}
                  </span>
                )}
                <span className="ml-auto shrink-0 text-xs text-slate-400">{at && formatTime(at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm text-slate-500">{last?.body ?? "새 대화"}</p>
                {unread > 0 && (
                  <span
                    className="shrink-0 rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white"
                    aria-label={`안 읽은 메시지 ${unread}개`}
                  >
                    {unread}
                  </span>
                )}
              </div>
            </button>
            {trailing && <div className="flex shrink-0 items-center gap-1 pr-3">{trailing(thread)}</div>}
          </li>
        );
      })}
    </ul>
  );
}
