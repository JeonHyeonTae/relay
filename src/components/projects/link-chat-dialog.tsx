"use client";

import { Users } from "lucide-react";
import { useState } from "react";
import { ChannelBadge } from "@/components/common/channel-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { useDemo, visibleThreads } from "@/lib/demo-context";
import { formatTime } from "@/lib/format";
import { isMyChat, lastAt, lastMessage, roomName } from "@/lib/thread";
import type { Project, Thread } from "@/lib/types";

/**
 * 스페이스에 채팅방 연결: 내가 참여한 채팅방 중에서 고른다. 한 채팅방을 여러 스페이스에 연결할 수 있고(n:m),
 * 연결하면 그 방의 대화가 이 스페이스 소통 내역에 쌓인다. 개인 대화로 표시한 메시지는 빠진다
 */
export function LinkChatDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const { threads, accounts, projects, currentUser, role, linkThreads, notify, logActivity } = useDemo();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const account = accounts.find((a) => a.id === project.accountId);
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "";
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "";

  const q = query.trim().toLowerCase();
  const candidates = visibleThreads(threads, currentUser, role)
    .filter((t) => isMyChat(t, currentUser) && !t.projectIds.includes(project.id))
    .filter((t) => !q || [roomName(t, currentUser.id), t.title, accountName(t.accountId)].some((s) => s.toLowerCase().includes(q)))
    .sort((a, b) => lastAt(b) - lastAt(a));
  // 이 고객사와의 채팅방을 먼저 보여 준다
  const sameAccount = candidates.filter((t) => t.accountId === project.accountId);
  const others = candidates.filter((t) => t.accountId !== project.accountId);

  const toggle = (id: string) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = () => {
    const names = threads.filter((t) => picked.includes(t.id)).map((t) => roomName(t, currentUser.id));
    linkThreads(project.id, picked);
    notify(`채팅방 ${picked.length}개를 연결했어요. 대화가 이 스페이스 소통 내역에 쌓여요.`);
    logActivity(`'${project.name}'에 채팅방 ${names.map((n) => `'${n}'`).join(", ")} 연결`);
    onClose();
  };

  const row = (t: Thread) => {
    const last = lastMessage(t);
    return (
      <li key={t.id}>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50">
          <input type="checkbox" className="mt-1 size-4" checked={picked.includes(t.id)} onChange={() => toggle(t.id)} />
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="flex items-center gap-2 text-sm">
              <ChannelBadge channel={t.channel} />
              <span className="truncate font-medium">{roomName(t, currentUser.id)}</span>
              {t.group && (
                <span className="flex shrink-0 items-center gap-0.5 text-xs text-slate-400">
                  <Users className="size-3" />
                  {t.group.members.length}
                </span>
              )}
              {last && <span className="ml-auto shrink-0 text-xs text-slate-400">{formatTime(last.at)}</span>}
            </p>
            <p className="truncate text-xs text-slate-500">{last?.body ?? "새 대화"}</p>
            <p className="truncate text-xs text-slate-400">
              {t.projectIds.length > 0 ? `연결된 스페이스: ${t.projectIds.map(projectName).join(", ")}` : "연결된 스페이스 없음"}
            </p>
          </div>
        </label>
      </li>
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="채팅방 연결"
      description="내가 참여한 채팅방 중에서 골라요. 한 채팅방을 여러 스페이스에 연결할 수 있어요. 연결하면 그 방의 대화가 이 스페이스 소통 내역에 쌓이고, 개인 대화로 표시한 메시지는 빠져요."
      footer={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={submit} disabled={picked.length === 0}>
            {picked.length > 0 ? `${picked.length}개 연결` : "연결"}
          </Button>
        </>
      }
    >
      <SearchInput value={query} onChange={setQuery} placeholder="채팅방·회사 이름 검색" className="sm:w-full" />
      {candidates.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          {q ? "검색에 맞는 채팅방이 없어요." : "더 연결할 채팅방이 없어요."}
        </p>
      ) : (
        <div className="max-h-96 space-y-3 overflow-y-auto">
          {sameAccount.length > 0 && (
            <section>
              <p className="px-2 text-xs font-semibold text-slate-500">{account?.name} 채팅방</p>
              <ul>{sameAccount.map(row)}</ul>
            </section>
          )}
          {others.length > 0 && (
            <section>
              <p className="px-2 text-xs font-semibold text-slate-500">다른 채팅방</p>
              <ul>{others.map(row)}</ul>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
