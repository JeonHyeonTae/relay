"use client";

import { CalendarClock, ChevronRight, ClipboardList, Handshake, Mail, MessageSquareReply, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChannelBadge } from "@/components/common/channel-badge";
import { DueLabel, TaskStatus, mondayOf } from "@/components/projects/monday";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SCENARIOS, scenarioTargets } from "@/lib/bulk-mail";
import { useDemo, visibleThreads } from "@/lib/demo-context";
import { daysUntil, formatDay, formatTime } from "@/lib/format";
import { DEMO_NOW, HANDOVERS } from "@/lib/mock-data";
import { isMyChat, lastAt, lastMessage, roomName } from "@/lib/thread";

/** 마감이 이 날짜 안에 들어오면 "다가오는 마감"에 보여 준다 */
const DUE_WITHIN_DAYS = 7;

/**
 * 오늘 할 일: 수신함·스페이스·먼데이에 흩어진 "나에게 걸린 일"을 한 화면에 모은다.
 * 로그인하면 처음 보는 화면 (기능정리 2-1 답장 필요 건 정리, 1-9 개인 투두·미답변 관리)
 */
export function TodayView() {
  const { threads, projects, accounts, currentUser, role } = useDemo();
  const me = currentUser;
  const myChats = visibleThreads(threads, me, role).filter((t) => isMyChat(t, me));
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "";

  const replies = myChats.filter((t) => t.needsReply).sort((a, b) => lastAt(b) - lastAt(a));
  const unread = myChats.reduce((sum, t) => sum + (t.unread ?? 0), 0);

  // 먼데이 하위 업무 중 내가 맡았고 아직 안 끝난 것, 일주일 안 마감(지난 것 포함)
  const deadlines = projects
    .flatMap((p) => (mondayOf(p.id)?.tasks ?? []).map((task) => ({ task, project: p })))
    .filter(({ task }) => task.ownerId === me.id && task.status !== "완료" && task.due && daysUntil(task.due) <= DUE_WITHIN_DAYS)
    .sort((a, b) => (a.task.due ?? "").localeCompare(b.task.due ?? ""));

  // 내가 참여한 스페이스에서 고객에게 한 약속
  const promises = projects
    .filter((p) => p.memberIds.includes(me.id) && p.status !== "완료")
    .flatMap((p) => (HANDOVERS.find((h) => h.projectId === p.id)?.promises ?? []).map((text) => ({ text, project: p })));

  const meetings = myChats.filter((t) => t.detectedMeeting);

  // 여러 고객사에 같은 일로 보낼 만한 안내 (정기 일정, 계약 갱신)
  const mailSuggestions = SCENARIOS.filter((sc) => sc.key === "maintenance" || sc.key === "renewal")
    .map((sc) => ({ scenario: sc, count: scenarioTargets(sc.key, accounts, projects).length }))
    .filter((x) => x.count > 0);

  return (
    <div className="space-y-5 px-8 py-7">
      <div>
        <h1 className="text-xl font-semibold">오늘 할 일</h1>
        <p className="mt-1 text-sm text-slate-500">
          {formatDay(DEMO_NOW)} · {me.name}님에게 걸린 일을 수신함·스페이스·먼데이에서 모았어요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile icon={MessageSquareReply} label="답장할 대화" value={replies.length} tone="text-rose-600" href="#replies" />
        <Tile icon={ClipboardList} label={`${DUE_WITHIN_DAYS}일 안 마감`} value={deadlines.length} tone="text-amber-600" href="#deadlines" />
        <Tile icon={Handshake} label="고객에게 한 약속" value={promises.length} tone="text-brand-600" href="#promises" />
        <Tile icon={Sparkles} label="안 읽은 메시지" value={unread} tone="text-slate-700" href="/inbox" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section id="replies" className="scroll-mt-4">
            <Card title="답장할 대화" icon={<MessageSquareReply className="size-4 text-rose-500" />} action={<MoreLink href="/inbox">수신함</MoreLink>}>
              {replies.length === 0 ? (
                <Empty>답장할 대화가 없어요.</Empty>
              ) : (
                <ul className="-my-2 divide-y divide-slate-100">
                  {replies.map((t) => {
                    const last = lastMessage(t);
                    const aiReady = t.aiDraft && t.aiReply !== false;
                    return (
                      <li key={t.id}>
                        <Link href={`/inbox?thread=${t.id}`} className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50">
                          <ChannelBadge channel={t.channel} />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-2 text-sm font-medium">
                              <span className="truncate">{roomName(t, me.id)}</span>
                              {aiReady && <Badge className="bg-brand-50 text-brand-700">AI 초안 준비됨</Badge>}
                            </p>
                            <p className="truncate text-sm text-slate-500">{last?.body}</p>
                            <p className="truncate text-xs text-slate-400">
                              {t.projectIds.map(projectName).join(" · ") || "연결한 스페이스 없음"}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {last && <span className="text-xs text-slate-400">{formatTime(last.at)}</span>}
                            {(t.unread ?? 0) > 0 && (
                              <span className="rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">{t.unread}</span>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </section>

          <section id="deadlines" className="scroll-mt-4">
            <Card
              title={`${DUE_WITHIN_DAYS}일 안에 마감되는 내 업무`}
              icon={<ClipboardList className="size-4 text-violet-500" />}
              action={<span className="text-xs text-slate-400">먼데이</span>}
            >
              {deadlines.length === 0 ? (
                <Empty>일주일 안에 마감되는 업무가 없어요.</Empty>
              ) : (
                <ul className="-my-2 divide-y divide-slate-100">
                  {deadlines.map(({ task, project }) => (
                    <li key={`${project.id}-${task.name}`}>
                      <Link
                        href={`/spaces/${project.id}?tab=tasks`}
                        className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50"
                      >
                        <TaskStatus status={task.status} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{task.name}</p>
                          <p className="truncate text-xs text-slate-400">{project.name}</p>
                        </div>
                        {task.due && <DueLabel iso={task.due} />}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </div>

        <div className="space-y-5">
          <section id="promises" className="scroll-mt-4">
            <Card title="고객에게 한 약속" icon={<Handshake className="size-4 text-brand-600" />}>
              {promises.length === 0 ? (
                <Empty>지킬 약속이 없어요.</Empty>
              ) : (
                <ul className="space-y-3">
                  {promises.map(({ text, project }) => (
                    <li key={text}>
                      <p className="text-sm text-slate-700">{text}</p>
                      <Link href={`/spaces/${project.id}`} className="text-xs text-brand-600 hover:underline">
                        {project.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-slate-400">대화에서 AI가 찾은 약속이에요.</p>
            </Card>
          </section>

          {mailSuggestions.length > 0 && (
            <Card title="보낼 만한 안내" icon={<Mail className="size-4 text-slate-500" />}>
              <ul className="space-y-2">
                {mailSuggestions.map(({ scenario, count }) => (
                  <li key={scenario.key}>
                    <Link
                      href={`/clients?send=${scenario.key}`}
                      className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{scenario.title}</span>
                        <span className="block text-xs text-slate-500">
                          {scenario.rule} {count}곳
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-slate-400" />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-400">누르면 대상과 문구가 채워진 채로 메일 쓰기가 열려요.</p>
            </Card>
          )}

          <Card title="미팅" icon={<CalendarClock className="size-4 text-slate-500" />}>
            {meetings.length === 0 ? (
              <Empty>대화에서 찾은 미팅이 없어요.</Empty>
            ) : (
              <ul className="space-y-3">
                {meetings.map((t) => (
                  <li key={t.id}>
                    <p className="text-sm font-medium">{t.detectedMeeting}</p>
                    <Link href={`/inbox?thread=${t.id}`} className="text-xs text-brand-600 hover:underline">
                      {roomName(t, me.id)} 대화
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, tone, href }: { icon: LucideIcon; label: string; value: number; tone: string; href: string }) {
  return (
    <a href={href} className="rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-brand-300">
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
    </a>
  );
}

function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center text-xs text-brand-600 hover:underline">
      {children}
      <ChevronRight className="size-3.5" />
    </Link>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-2 text-sm text-slate-400">{children}</p>;
}
