"use client";

import { ArrowLeft, ArrowRight, CalendarPlus, Check, Lightbulb, Lock, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { ChannelBadge } from "@/components/common/channel-badge";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import { formatClock, formatDay } from "@/lib/format";
import { findStaff } from "@/lib/mock-data";
import { needsTags, roomName } from "@/lib/thread";
import type { Thread } from "@/lib/types";
import { CatchUpSummary } from "./catch-up-summary";
import { DraftReply, type DraftSuggestion } from "./draft-reply";
import { MessageTag } from "./message-tag";
import { keepThreadInHistory } from "./thread-link";

interface ConversationPanelProps {
  thread: Thread;
  /** 좁은 화면에서 비슷한 과거 건 서랍 열기 */
  onShowSimilar: () => void;
  /** 답장 뒤 넘어갈 다음 답장 필요 건 */
  nextPending?: Thread;
  onOpenThread: (id: string) => void;
  /** 비슷한 과거 건을 참고해 다시 쓴 초안 */
  suggestion?: DraftSuggestion;
  /** 과거 건·근거 링크로 넘어왔을 때 원래 대화 */
  backTo?: Thread;
  onBack?: () => void;
  /** 소통 내역 등에서 특정 메시지를 눌러 왔을 때 그 메시지 */
  focusMessageId?: string;
}

const dayKey = (iso: string) => new Date(iso).toDateString();

export function ConversationPanel({
  thread,
  onShowSimilar,
  nextPending,
  onOpenThread,
  suggestion,
  backTo,
  onBack,
  focusMessageId,
}: ConversationPanelProps) {
  const { accounts, projects, channelAccounts, currentUser, setAiReply, logActivity, team } = useDemo();
  const [meetingAdded, setMeetingAdded] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const account = accounts.find((a) => a.id === thread.accountId);
  // 이 대화가 들어온 계정. 답장도 이 계정으로 나간다
  const via = channelAccounts.find((a) => a.id === thread.via);
  const linked = thread.projectIds.map((id) => projects.find((p) => p.id === id)).filter((p) => p !== undefined);
  // 여러 프로젝트에 연결했거나 개인 대화가 섞인 방은 메시지마다 쌓이는 곳을 붙인다
  const showTags = needsTags(thread);
  const aiOn = thread.aiReply !== false;
  // 열자마자 읽음 처리되므로, 연 순간의 안 읽은 수와 그때의 메시지 수를 기억해 둔다
  const [unreadAtOpen] = useState(thread.unread ?? 0);
  const openedCount = useRef(thread.messages.length);
  const firstUnreadId = unreadAtOpen > 0 ? thread.messages[openedCount.current - unreadAtOpen]?.id : undefined;
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 다른 사람의 개인 연락을 열면 활동 기록에 남긴다 (열람 권한, 기능정리 6-2)
  const viewLogged = useRef(false);
  useEffect(() => {
    if (viewLogged.current) return;
    viewLogged.current = true;
    if (thread.visibility === "personal" && thread.ownerId !== currentUser.id) {
      logActivity(`${findStaff(thread.ownerId).name}님 개인 연락 '${roomName(thread, currentUser.id)}' 열람`);
    }
    // 대화를 열 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 메시지 몇 개를 잠깐 강조한다
  const flash = (messageIds: string[]) => {
    setHighlighted(messageIds);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlighted([]), 2500);
  };

  // 열 때: 눌러서 온 메시지가 있으면 그 메시지, 없으면 안 읽은 첫 메시지(없으면 가장 최근 메시지)로.
  // 보낸 뒤에는 맨 아래로
  useEffect(() => {
    const el = scrollRef.current;
    const opening = thread.messages.length === openedCount.current;
    const focused = opening && focusMessageId && el?.querySelector(`[data-message-id="${focusMessageId}"]`);
    if (focused && focusMessageId) {
      focused.scrollIntoView({ block: "center" });
      flash([focusMessageId]);
      return;
    }
    const divider = opening && el?.querySelector("[data-unread-divider]");
    if (divider) divider.scrollIntoView({ block: "start" });
    else el?.scrollTo({ top: el.scrollHeight });
  }, [thread.messages.length]);

  useEffect(() => () => {
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
  }, []);

  // 요약 한 줄의 근거 메시지로 가서 잠깐 강조한다
  const jumpTo = (messageIds: string[]) => {
    scrollRef.current
      ?.querySelector(`[data-message-id="${messageIds[0]}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
    flash(messageIds);
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      {backTo && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-6 py-2 text-left text-xs text-slate-600 hover:bg-brand-50 hover:text-brand-700"
        >
          <ArrowLeft className="size-3.5" />
          <span className="font-medium">{roomName(backTo, currentUser.id)}</span> 대화로 돌아가기
        </button>
      )}
      {/* 목록과 같은 채팅방 이름을 크게, 회사·프로젝트는 작게. 사람은 채팅방이 아니라 프로젝트 참여자로 관리한다 */}
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-2">
          <ChannelBadge channel={thread.channel} />
          <h2 className="truncate text-base font-semibold">{roomName(thread, currentUser.id)}</h2>
          {thread.group && (
            <button
              type="button"
              onClick={() => setShowMembers((v) => !v)}
              aria-expanded={showMembers}
              className="flex shrink-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-xs text-slate-500 hover:bg-slate-100"
              title="참여자 보기"
            >
              <Users className="size-3.5" />
              {thread.group.members.length}
            </button>
          )}
          {thread.visibility === "personal" && (
            <Badge className="bg-slate-100 text-slate-500">
              <Lock className="size-3" />
              개인 연락
            </Badge>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {/* 좁은 화면에서는 오른쪽 칸이 숨으므로 여기서 연다 */}
            {thread.similarCaseIds?.length ? (
              <button
                type="button"
                onClick={onShowSimilar}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-slate-600 hover:bg-slate-100 xl:hidden"
              >
                <Lightbulb className="size-3.5 text-amber-500" />
                비슷한 과거 건 {thread.similarCaseIds.length}
              </button>
            ) : null}
            <Switch
              checked={aiOn}
              onChange={(on) => setAiReply(thread.id, on)}
              title="이 채팅방에서 AI 답장 초안을 쓸지 정해요"
              label={
                <>
                  <Sparkles className="size-3.5 text-brand-600" />
                  AI 답장
                </>
              }
            />
          </div>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link
            href={`/clients/${thread.accountId}?from=${thread.id}`}
            onClick={() => keepThreadInHistory(thread.id)}
            className="font-medium text-brand-600 hover:underline"
          >
            {account?.name}
          </Link>
          <span>›</span>
          {linked.length === 0 ? (
            <span className="text-slate-400">연결한 프로젝트 없음 · 이 방의 대화는 쌓이지 않아요</span>
          ) : (
            linked.map((p, i) => (
              <Fragment key={p.id}>
                {i > 0 && <span className="text-slate-300">·</span>}
                <Link
                  href={`/projects/${p.id}?from=${thread.id}`}
                  onClick={() => keepThreadInHistory(thread.id)}
                  className="hover:text-brand-600 hover:underline"
                >
                  {p.name}
                </Link>
              </Fragment>
            ))
          )}
          {via && (
            <span className="ml-auto truncate text-slate-400" title="이 계정으로 받은 대화예요. 답장도 이 계정으로 나가요.">
              받은 계정 {via.address}
            </span>
          )}
        </div>
        {showMembers && thread.group && (
          <p className="mt-1.5 text-xs text-slate-600">참여자 {thread.group.members.join(", ")}</p>
        )}
      </header>

      {unreadAtOpen >= team.catchUpMin && thread.catchUp?.length ? (
        <CatchUpSummary unread={unreadAtOpen} points={thread.catchUp} onJump={jumpTo} />
      ) : null}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {thread.isNewInquiry && thread.similarCaseIds?.length ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
            <Lightbulb className="size-4 shrink-0" />
            <span className="flex-1">
              신규 문의예요. 비슷한 과거 건 {thread.similarCaseIds.length}건을 찾았어요.
              <span className="hidden xl:inline"> 오른쪽에서 확인하세요.</span>
            </span>
            <Button size="sm" className="xl:hidden" onClick={onShowSimilar}>
              보기
            </Button>
          </div>
        ) : null}

        {thread.messages.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            {roomName(thread, currentUser.id)}님과 아직 주고받은 메시지가 없어요.
          </p>
        )}

        {/* 메신저처럼 내 메시지만 오른쪽. 다른 사람은 왼쪽에 프로필·이름·소속을 달고,
            같은 사람이 이어서 보내면 프로필 없이 붙인다. 날짜가 바뀌면 구분선 */}
        {thread.messages.map((m, i) => {
          const prev = thread.messages[i - 1];
          const newDay = !prev || dayKey(prev.at) !== dayKey(m.at);
          const sameRun = !newDay && prev.authorName === m.authorName;
          const isMe = m.authorId === currentUser.id;
          const staff = m.authorId ? findStaff(m.authorId) : null;
          const lit = highlighted.includes(m.id);
          return (
            <Fragment key={m.id}>
              {newDay && (
                <div className={cn("flex justify-center", i > 0 && "mt-5")}>
                  <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs text-slate-500">{formatDay(m.at)}</span>
                </div>
              )}
              {m.id === firstUnreadId && (
                <div data-unread-divider className="mt-5 flex scroll-mt-4 items-center gap-3 text-xs font-medium text-rose-500">
                  <span className="h-px flex-1 bg-rose-200" />
                  여기부터 안 읽은 메시지
                  <span className="h-px flex-1 bg-rose-200" />
                </div>
              )}
              {isMe ? (
                <div data-message-id={m.id} className={cn("flex justify-end", sameRun ? "mt-1" : "mt-4")}>
                  <div className="flex max-w-[75%] flex-col items-end">
                    <div className="flex max-w-full items-end gap-1.5">
                      <span className="shrink-0 text-xs text-slate-400">{formatClock(m.at)}</span>
                      <div
                        className={cn(
                          "min-w-0 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-white transition-shadow",
                          lit && "ring-4 ring-amber-300",
                        )}
                      >
                        {m.body}
                      </div>
                    </div>
                    {showTags && <MessageTag thread={thread} message={m} />}
                  </div>
                </div>
              ) : (
                <div data-message-id={m.id} className={cn("flex items-start gap-2", sameRun ? "mt-1" : "mt-4")}>
                  {sameRun ? <span className="w-8 shrink-0" /> : <Avatar name={m.authorName} />}
                  <div className="flex min-w-0 max-w-[75%] flex-col items-start">
                    {!sameRun && (
                      <span className="mb-1 text-xs">
                        <span className="font-medium text-slate-700">{m.authorName}</span>
                        <span className="ml-1.5 text-slate-400">{staff ? staff.team : account?.name}</span>
                      </span>
                    )}
                    <div className="flex max-w-full items-end gap-1.5">
                      <div
                        className={cn(
                          "min-w-0 rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap transition-shadow",
                          staff ? "border border-brand-100 bg-brand-50" : "border border-slate-200 bg-white",
                          lit && "ring-4 ring-amber-300",
                        )}
                      >
                        {m.body}
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{formatClock(m.at)}</span>
                    </div>
                    {showTags && <MessageTag thread={thread} message={m} />}
                  </div>
                </div>
              )}
            </Fragment>
          );
        })}

        {thread.detectedMeeting && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm">
            <CalendarPlus className="size-4 text-brand-600" />
            <span>
              미팅 일정 감지: <strong className="font-medium">{thread.detectedMeeting}</strong>
            </span>
            <Button
              size="sm"
              className="ml-auto"
              variant={meetingAdded ? "ghost" : "secondary"}
              disabled={meetingAdded}
              onClick={() => setMeetingAdded(true)}
            >
              {meetingAdded ? (
                <>
                  <Check className="size-3.5" />
                  캘린더에 추가됨
                </>
              ) : (
                "캘린더에 추가"
              )}
            </Button>
          </div>
        )}
      </div>

      <footer className="space-y-3 border-t border-slate-200 bg-white p-4">
        {!thread.needsReply && nextPending && (
          <button
            type="button"
            onClick={() => onOpenThread(nextPending.id)}
            className="flex w-full items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-left text-sm hover:bg-brand-50"
          >
            <span className="shrink-0 text-xs text-slate-500">다음 답장 필요 건</span>
            <ChannelBadge channel={nextPending.channel} />
            <span className="min-w-0 flex-1 truncate font-medium">{roomName(nextPending, currentUser.id)}</span>
            <ArrowRight className="size-4 shrink-0 text-brand-600" />
          </button>
        )}
        {/* AI 답장을 켜고 끌 때 초안 상태를 새로 시작한다 */}
        <DraftReply
          key={`${thread.id}-${aiOn}-${suggestion?.key ?? ""}`}
          thread={thread}
          aiOn={aiOn}
          suggestion={suggestion}
        />
      </footer>
    </section>
  );
}
