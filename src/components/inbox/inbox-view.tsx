"use client";

import { Inbox } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CHANNELS } from "@/lib/channels";
import { cn } from "@/lib/cn";
import { useDemo, visibleThreads } from "@/lib/demo-context";
import { isTyping } from "@/lib/keyboard";
import { lastAt, roomName } from "@/lib/thread";
import { SIMILAR_CASES, findStaff } from "@/lib/mock-data";
import type { ChannelId } from "@/lib/types";
import { ConversationPanel } from "./conversation-panel";
import { SimilarCasesPanel } from "./similar-cases-panel";
import type { DraftSuggestion } from "./draft-reply";
import { keepThreadInHistory, threadHref } from "./thread-link";
import { ThreadList } from "./thread-list";

export function InboxView() {
  const {
    threads,
    accounts,
    projects,
    channelAccounts,
    currentUser,
    role,
    markRead,
    notify,
    caseDrafts,
    setCaseDraft,
    askDrafts,
    askAbout,
  } = useDemo();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [channel, setChannel] = useState<ChannelId | "all">("all");
  // 한 채널에 계정이 여럿이면(메일 주소 여러 개 등) 계정으로도 거른다
  const [via, setVia] = useState("all");
  const pickChannel = (id: ChannelId | "all") => {
    setChannel(id);
    setVia("all");
  };
  // 좁은 화면에서는 비슷한 과거 건을 서랍으로 연다
  const [similarOpen, setSimilarOpen] = useState(false);
  const visible = useMemo(() => visibleThreads(threads, currentUser, role), [threads, currentUser, role]);
  // 처음에는 아무 대화도 열지 않는다. 열면 바로 읽음 처리되므로 사용자가 고른 대화만 연다.
  // 답장 후에도 선택이 다른 대화로 넘어가지 않게 고정한다.
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get("thread"));
  // 수신함 안에서 ?thread= 링크를 눌러도 해당 대화로 이동
  const threadParam = searchParams.get("thread");
  useEffect(() => {
    if (!threadParam) return;
    setSelectedId(threadParam);
    setChannel("all");
    setVia("all");
  }, [threadParam]);


  const channelsInUse = useMemo(() => Array.from(new Set(visible.map((t) => t.channel))), [visible]);

  // 고른 채널에서 대화가 들어온 계정들
  const accountsInChannel = useMemo(
    () =>
      channel === "all"
        ? []
        : channelAccounts.filter((a) => a.channel === channel && visible.some((t) => t.channel === channel && t.via === a.id)),
    [channel, channelAccounts, visible],
  );

  const list = useMemo(
    () =>
      visible
        .filter((t) => channel === "all" || t.channel === channel)
        .filter((t) => via === "all" || t.via === via)
        .sort((a, b) => lastAt(b) - lastAt(a)),
    [visible, channel, via],
  );

  const selected = list.find((t) => t.id === selectedId);
  const selectedIndex = selected ? list.indexOf(selected) : -1;
  // 과거 건·근거 링크로 넘어온 대화면 원래 대화로 돌아가는 버튼을 보여 준다
  const fromParam = searchParams.get("from");
  // 소통 내역에서 특정 메시지를 눌러 온 경우
  const focusMessageId = selected && selected.id === threadParam ? (searchParams.get("msg") ?? undefined) : undefined;
  const backTo = selected && selected.id === threadParam ? visible.find((t) => t.id === fromParam) : undefined;
  // 답장을 보내고 나면 과거 건 초안도 끝난다
  const usedCase = selected?.needsReply ? SIMILAR_CASES.find((c) => c.id === caseDrafts[selected.id]) : undefined;
  const caseSuggestion: DraftSuggestion | undefined = usedCase && {
    key: usedCase.id,
    text: usedCase.draft,
    sources: [{ threadId: usedCase.threadId, note: usedCase.resolution }],
  };
  // 동료와의 1:1 채팅에서 과거 건을 물어볼 때: 지금 문의와 과거 건을 붙인 질문 초안
  const ask = selected ? askDrafts[selected.id] : undefined;
  const askCase = ask && SIMILAR_CASES.find((c) => c.id === ask.caseId);
  const askFrom = ask && threads.find((t) => t.id === ask.fromThreadId);
  const accountOfProject = (projectId: string) =>
    accounts.find((a) => a.id === projects.find((p) => p.id === projectId)?.accountId)?.name ?? "";
  const askSuggestion: DraftSuggestion | undefined =
    askCase && askFrom
      ? {
          key: `ask-${askCase.id}`,
          text:
            `${findStaff(askCase.ownerId).name}님, ${accountOfProject(askCase.projectId)} "${askCase.title}" 건 여쭤볼게요. ` +
            `지금 ${accounts.find((a) => a.id === askFrom.accountId)?.name ?? ""} ${roomName(askFrom, currentUser.id)} 대화에 ` +
            `비슷한 문의${askFrom.similarBasis ? `(${askFrom.similarBasis.topic})` : ""}가 왔는데, ` +
            "당시 어떻게 안내하셨는지, 주의할 점이 있었는지 알려 주실 수 있을까요?",
          sources: [
            { threadId: askFrom.id, note: "지금 문의" },
            { threadId: askCase.threadId, note: "물어볼 과거 건" },
          ],
        }
      : undefined;
  const suggestion = askSuggestion ?? caseSuggestion;
  const nextPending = list.find((t) => t.needsReply && t.id !== selected?.id);

  // 연 대화는 읽음으로 바꾼다
  useEffect(() => {
    if (selected?.unread) markRead(selected.id);
  }, [selected, markRead]);

  // ↑/↓로 이전·다음 대화
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const next = list[selectedIndex + (e.key === "ArrowDown" ? 1 : -1)];
      if (!next) return;
      e.preventDefault();
      setSelectedId(next.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [list, selectedIndex]);

  return (
    <div className="flex h-full">
      <section className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white xl:w-[22rem]">
        <div className="space-y-3 border-b border-slate-200 p-4">
          <h1 className="text-lg font-semibold">통합 수신함</h1>
          <div className="flex flex-wrap gap-1">
            <ChannelChip active={channel === "all"} onClick={() => pickChannel("all")} label="모든 채널" />
            {channelsInUse.map((id) => (
              <ChannelChip key={id} active={channel === id} onClick={() => pickChannel(id)} label={CHANNELS[id].short} />
            ))}
          </div>
          {accountsInChannel.length > 1 && (
            <select
              value={via}
              onChange={(e) => setVia(e.target.value)}
              aria-label="받은 계정"
              className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-brand-400"
            >
              <option value="all">모든 계정 ({accountsInChannel.length}개)</option>
              {accountsInChannel.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.address} · {a.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <ThreadList threads={list} selectedId={selected?.id} onSelect={setSelectedId} />
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">↑ ↓ 키로 대화를 넘길 수 있어요</p>
      </section>

      {selected ? (
        <>
          <ConversationPanel
            key={`${selected.id}-${focusMessageId ?? ""}`}
            thread={selected}
            onShowSimilar={() => setSimilarOpen(true)}
            nextPending={nextPending}
            onOpenThread={setSelectedId}
            suggestion={suggestion}
            backTo={backTo}
            focusMessageId={focusMessageId}
            onBack={() => backTo && router.replace(threadHref(backTo.id))}
          />
          {/* 비슷한 과거 건이 없는 대화에서는 오른쪽 칸을 띄우지 않는다 */}
          {selected.similarCaseIds?.length ? (
            <SimilarCasesPanel
              key={`similar-${selected.id}`}
              thread={selected}
              open={similarOpen}
              onClose={() => setSimilarOpen(false)}
              onUseCase={(c) => {
                setCaseDraft(selected.id, c.id);
                setSimilarOpen(false);
                notify("과거 건을 참고해 초안을 다시 썼어요.");
              }}
              onAsk={(c) => {
                const chatId = askAbout(c.id, selected.id);
                setSimilarOpen(false);
                keepThreadInHistory(selected.id);
                router.push(threadHref(chatId, selected.id));
              }}
            />
          ) : null}
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
          <Inbox className="size-8" />
          {list.length === 0 ? (
            <p className="text-sm">조건에 맞는 대화가 없어요.</p>
          ) : (
            <p className="text-sm">왼쪽 목록에서 대화를 골라 주세요.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ChannelChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-0.5 text-xs",
        active ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}
