"use client";

import {
  ArrowLeft,
  ArrowRightLeft,
  ArrowUpRight,
  BookOpen,
  Building2,
  ChevronRight,
  ClipboardList,
  Contact,
  FileText,
  LayoutDashboard,
  Link2,
  Link2Off,
  ListTodo,
  Lock,
  MessageSquare,
  MessagesSquare,
  Mic,
  Pencil,
  Plus,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BackToConversation } from "@/components/common/back-to-conversation";
import { ChannelBadge } from "@/components/common/channel-badge";
import { CommunicationTimeline } from "@/components/common/communication-timeline";
import { ProjectStatusBadge } from "@/components/common/project-status-badge";
import { DocPreviewModal } from "@/components/docs/doc-preview-modal";
import { DocTable } from "@/components/docs/doc-table";
import { UploadDialog } from "@/components/docs/upload-dialog";
import { ThreadList } from "@/components/inbox/thread-list";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ColumnPicker, useStoredColumns } from "@/components/ui/column-picker";
import { cn } from "@/lib/cn";
import { useDemo, visibleThreads } from "@/lib/demo-context";
import { docLayer } from "@/lib/docs";
import { formatDate, formatDateTime } from "@/lib/format";
import { HANDOVERS, MEETINGS, MONDAY_SYNCED_AT, PROJECT_FACTS, findStaff } from "@/lib/mock-data";
import { isMyChat, lastAt, messageTags, roomName } from "@/lib/thread";
import type { ChannelId, Contact as ContactPerson, MondayItem, Thread } from "@/lib/types";
import { ContactDialog } from "./contact-dialog";
import { DocDraftDialog } from "./doc-draft-dialog";
import { LinkChatDialog } from "./link-chat-dialog";
import { MeetingsTab } from "./meetings-tab";
import { MemberDialog } from "./member-dialog";
import {
  DueLabel,
  MondayDot,
  NextDueCell,
  PriorityBadge,
  ProgressBar,
  StageBadge,
  TaskStatus,
  formatAmount,
  mondayOf,
  openTasks,
} from "./monday";

type Tab = "overview" | "tasks" | "meetings" | "chats" | "docs" | "comms";

/** 이 대화에 그 고객사 사람이 나오는지 (보낸 메시지나 단체방 참여자로) */
const mentions = (thread: Thread, name: string) =>
  thread.messages.some((m) => !m.authorId && m.authorName.startsWith(name)) ||
  Boolean(thread.group?.members.some((member) => member.startsWith(name)));

/**
 * 프로젝트를 열면 개요부터: 요약·지금 할 일·핵심 정보·최근 문서를 한 화면에.
 * 오른쪽에는 사람(참여자·고객사 연락처)과 모든 답장에 먼저 적용되는 회사 기준 (기능정리 3-2, 3-3, 5-1~5-3)
 */
export function ProjectDetail({ id }: { id: string }) {
  const { projects, accounts, threads, docs, currentUser, role, removeMember, unlinkThread, notify, logActivity } = useDemo();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const asked = searchParams.get("tab");
    return asked === "tasks" || asked === "meetings" || asked === "chats" || asked === "docs" || asked === "comms"
      ? asked
      : "overview";
  });
  const [openDocId, setOpenDocId] = useState<string | null>(searchParams.get("doc"));
  const [uploading, setUploading] = useState(false);
  // 참여자 추가(replacing 없음) 또는 교체 창
  const [memberDialog, setMemberDialog] = useState<{ replacing?: string } | null>(null);
  const [handedOver, setHandedOver] = useState<{ from: string; to: string } | null>(null);
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [linking, setLinking] = useState(false);

  const project = projects.find((p) => p.id === id);
  if (!project) {
    return <p className="p-8 text-sm text-slate-500">프로젝트를 찾을 수 없어요.</p>;
  }

  const account = accounts.find((a) => a.id === project.accountId);
  const members = project.memberIds.map(findStaff);
  const brief = HANDOVERS.find((h) => h.projectId === id);
  const projectDocs = docs.filter((d) => d.projectId === id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  // 이 프로젝트에 연결한 채팅방. 한 채팅방이 여러 프로젝트에 연결될 수 있다
  const allThreads = threads.filter((t) => t.projectIds.includes(id));
  const readable = visibleThreads(allThreads, currentUser, role);
  const hiddenCount = allThreads.length - readable.length;
  const myChats = readable.filter((t) => isMyChat(t, currentUser)).sort((a, b) => lastAt(b) - lastAt(a));
  // 탭을 열지 않아도 보이게, 내 채팅방의 안 읽은 메시지 수를 탭 이름 옆에 붙인다
  const myUnread = myChats.reduce((sum, t) => sum + (t.unread ?? 0), 0);
  // 고객사 연락처는 이 프로젝트 대화에 나온 사람만 자동으로 모은다. 쓰는 채널과 가장 최근 대화도 함께
  const contacts = (account?.contacts ?? [])
    .filter((c) => allThreads.some((t) => mentions(t, c.name)))
    .map((c) => {
      const withThem = readable.filter((t) => mentions(t, c.name)).sort((a, b) => lastAt(b) - lastAt(a));
      const channels = Array.from(new Set(withThem.map((t) => t.channel))) as ChannelId[];
      return { contact: c, channels, latest: withThem[0] };
    });
  // 연결한 채팅방이라도 다른 프로젝트 얘기나 개인 대화로 표시한 메시지는 세지 않는다
  const messageCount = readable.reduce((sum, t) => sum + t.messages.filter((m) => messageTags(t, m).includes(id)).length, 0);
  const facts = PROJECT_FACTS.filter((f) => f.projectId === id);
  const companyDocs = docs.filter((d) => docLayer(d) === "standard");
  const commonDocs = docs.filter((d) => d.accountId === project?.accountId);
  const hasTodo = Boolean(brief && (brief.openIssues.length || brief.promises.length));
  const monday = mondayOf(id);
  const meetingCount = MEETINGS.filter((m) => m.projectId === id).length;

  return (
    <div className="space-y-5 px-8 py-6">
      <BackToConversation />
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <Link href="/projects" className="inline-flex items-center gap-1 hover:text-slate-700">
          <ArrowLeft className="size-3.5" />
          프로젝트
        </Link>
        {account && (
          <>
            <span className="text-slate-300">/</span>
            <Link href={`/clients/${account.id}`} className="hover:text-slate-700">
              {account.name}
            </Link>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {account && (
              <Link href={`/clients/${account.id}`} className="hover:text-brand-600 hover:underline">
                {account.name}
              </Link>
            )}
            <span>· 소통 채널</span>
            {project.channels.map((c) => (
              <ChannelBadge key={c} channel={c} />
            ))}
          </div>
          {monday && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5" title="먼데이에서 받아온 값">
                <MondayDot />
                <StageBadge stage={monday.stage} />
              </span>
              <ProgressBar value={monday.progress} />
              <span className="flex items-center gap-1">
                다음 마감 <NextDueCell item={monday} className="text-xs" />
              </span>
            </div>
          )}
        </div>
        <div className="ml-auto flex gap-2">
          <Button onClick={() => setDrafting(true)}>
            <Sparkles className="size-4" />
            견적서·계약서 초안
          </Button>
          <Button variant="primary" onClick={() => setUploading(true)}>
            <Upload className="size-4" />
            문서 올리기
          </Button>
        </div>
      </div>

      {handedOver && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-900">
          {handedOver.from}님 대신 {handedOver.to}님이 참여해요. 맡던 대화가 넘어갔으니 개요의 요약과 지금 할 일부터 확인하세요.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={<LayoutDashboard className="size-4" />}>
              개요
            </TabButton>
            {monday && (
              <TabButton active={tab === "tasks"} onClick={() => setTab("tasks")} icon={<ClipboardList className="size-4" />}>
                업무 {monday.tasks.length}
              </TabButton>
            )}
            <TabButton active={tab === "meetings"} onClick={() => setTab("meetings")} icon={<Mic className="size-4" />}>
              회의 {meetingCount}
            </TabButton>
            <TabButton active={tab === "chats"} onClick={() => setTab("chats")} icon={<MessagesSquare className="size-4" />}>
              채팅방 {myChats.length}
              {myUnread > 0 && (
                <span
                  className="rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white"
                  aria-label={`안 읽은 메시지 ${myUnread}개`}
                >
                  {myUnread}
                </span>
              )}
            </TabButton>
            <TabButton active={tab === "docs"} onClick={() => setTab("docs")} icon={<FileText className="size-4" />}>
              문서 {projectDocs.length}
            </TabButton>
            <TabButton active={tab === "comms"} onClick={() => setTab("comms")} icon={<MessageSquare className="size-4" />}>
              소통 내역 {messageCount}
            </TabButton>
          </div>

          {tab === "overview" && (
            <>
              <Card title="프로젝트 요약" icon={<Sparkles className="size-4 text-brand-600" />}>
                <p className="text-sm leading-relaxed text-slate-700">
                  {brief?.summary ?? "아직 요약이 없어요. 대화와 문서가 쌓이면 AI가 정리해요."}
                </p>
                <p className="mt-2 text-xs text-slate-400">대화와 문서를 바탕으로 AI가 정리했어요. 새로 참여한 사람은 여기부터 읽으면 돼요.</p>
              </Card>

              <WorkStatus item={monday} done={project.status === "완료"} onShowAll={() => setTab("tasks")} />

              {hasTodo && brief && (
                <Card title="지금 할 일" icon={<ListTodo className="size-4 text-rose-500" />}>
                  <p className="-mt-1 mb-3 text-xs text-slate-500">대화에서 AI가 찾은 할 일이에요. 먼데이 업무와 견줘 보세요.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TodoList title="답해야 할 것" items={brief.openIssues} dot="bg-rose-500" />
                    <TodoList title="우리가 한 약속" items={brief.promises} dot="bg-amber-500" />
                  </div>
                </Card>
              )}

              {facts.length > 0 && (
                <Card title="핵심 정보" icon={<Sparkles className="size-4 text-brand-600" />}>
                  <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    {facts.map((fact) => {
                      const doc = docs.find((d) => d.id === fact.docId);
                      const thread = threads.find((t) => t.id === fact.threadId);
                      return (
                        <div key={fact.id}>
                          <dt className="text-xs text-slate-500">{fact.label}</dt>
                          <dd className="text-sm font-medium">{fact.value}</dd>
                          <dd className="mt-0.5 truncate text-xs">
                            {doc && (
                              <button type="button" onClick={() => setOpenDocId(doc.id)} className="text-brand-600 hover:underline">
                                출처: {doc.title}
                              </button>
                            )}
                            {thread && (
                              <Link href={`/inbox?thread=${thread.id}`} className="text-brand-600 hover:underline">
                                출처: 대화
                              </Link>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </Card>
              )}

              <Card
                title="최근 문서"
                icon={<FileText className="size-4 text-slate-500" />}
                action={
                  projectDocs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab("docs")}
                      className="inline-flex items-center text-xs text-brand-600 hover:underline"
                    >
                      전체 {projectDocs.length}개
                      <ChevronRight className="size-3.5" />
                    </button>
                  )
                }
              >
                {projectDocs.length === 0 ? (
                  <p className="text-sm text-slate-400">아직 문서가 없어요.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {projectDocs.slice(0, 3).map((d) => (
                      <li key={d.id}>
                        <button
                          type="button"
                          onClick={() => setOpenDocId(d.id)}
                          className="flex w-full items-center gap-2 py-2 text-left text-sm hover:text-brand-600"
                        >
                          <FileText className="size-4 shrink-0 text-slate-400" />
                          <span className="min-w-0 flex-1 truncate">{d.title}</span>
                          <span className="shrink-0 text-xs text-slate-400">
                            {d.kind} · {formatDate(d.updatedAt)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
          )}

          {tab === "tasks" && monday && <TaskTable item={monday} readable={readable} />}

          {tab === "meetings" && <MeetingsTab projectId={id} onOpenDoc={setOpenDocId} />}

          {tab === "chats" && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 text-xs text-slate-500">
                  이 프로젝트에 연결한 채팅방 중 내가 참여한 방이에요. 한 채팅방을 여러 프로젝트에 연결할 수 있어요.
                </p>
                <Button size="sm" onClick={() => setLinking(true)}>
                  <Link2 className="size-3.5" />
                  채팅방 연결
                </Button>
              </div>
              {myChats.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                  연결한 채팅방이 없어요. 채팅방 연결로 이 프로젝트 얘기를 하는 방을 넣어 주세요.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <ThreadList
                    threads={myChats}
                    onSelect={(threadId) => router.push(`/inbox?thread=${threadId}`)}
                    trailing={(t) => {
                      const others = t.projectIds.filter((p) => p !== id);
                      const name = roomName(t, currentUser.id);
                      return (
                        <>
                          {others.length > 0 && (
                            <span
                              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs whitespace-nowrap text-slate-500"
                              title={`함께 연결한 프로젝트: ${others.map((p) => projects.find((x) => x.id === p)?.name).join(", ")}`}
                            >
                              다른 프로젝트 {others.length}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              unlinkThread(id, t.id);
                              notify(`'${name}' 연결을 끊었어요. 이 방의 대화는 소통 내역에서 빠져요.`);
                              logActivity(`'${project.name}'에서 채팅방 '${name}' 연결 끊음`);
                            }}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label={`${name} 연결 끊기`}
                            title="연결 끊기"
                          >
                            <Link2Off className="size-4" />
                          </button>
                        </>
                      );
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {tab === "docs" && (
            <>
              <DocTable docs={projectDocs} onOpen={setOpenDocId} />
              <p className="text-xs text-slate-500">메일·메신저로 주고받은 첨부파일은 자동으로 이 프로젝트 문서에 저장됩니다.</p>
            </>
          )}

          {/* 논의 필요: 동료끼리 1:1 채팅도 여기 보인다. 화면별_기능정리.md "논의할 것" 참고 */}
          {tab === "comms" && (
            <Card>
              <CommunicationTimeline threads={readable} projectId={id} />
              <p className="mt-5 text-xs text-slate-400">
                연결한 채팅방에서 이 프로젝트로 쌓인 메시지만 보여요. 다른 프로젝트 얘기와 개인 대화로 표시한 메시지는 빠지고, 여러 프로젝트에 함께 쌓인 메시지는 표시가 붙어요.
              </p>
              {hiddenCount > 0 && (
                <p className="mt-5 flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <Lock className="size-3.5" />
                  개인에게 온 연락 {hiddenCount}건은 본인과 팀장만 볼 수 있어요.
                </p>
              )}
            </Card>
          )}
        </div>

        {/* 오른쪽은 흰 카드가 아니라 회색 옆 패널: 가운데 내용과 한눈에 구분되게 */}
        <aside className="h-fit divide-y divide-slate-200 rounded-xl bg-slate-100/80 px-4">
          <SideSection
            title="참여자"
            icon={<Users className="size-3.5" />}
            action={
              <button
                type="button"
                onClick={() => setMemberDialog({})}
                className="inline-flex items-center gap-0.5 text-xs font-medium text-brand-600 hover:underline"
              >
                <Plus className="size-3.5" />
                추가
              </button>
            }
          >
            <ul className="space-y-2.5">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  <Avatar name={m.name} className="size-7" />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm font-medium">
                      {m.name}
                      {m.id === currentUser.id && <span className="text-xs font-normal text-slate-400">나</span>}
                      {m.note && <Badge className="bg-amber-100 text-amber-800">{m.note}</Badge>}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {m.team} · {m.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMemberDialog({ replacing: m.id })}
                    className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-brand-600"
                    aria-label={`${m.name}님 교체`}
                    title="교체"
                  >
                    <ArrowRightLeft className="size-3.5" />
                  </button>
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        removeMember(id, m.id);
                        notify(`${m.name}님을 참여자에서 뺐어요.`);
                      }}
                      className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-600"
                      aria-label={`${m.name}님 빼기`}
                      title="빼기"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </SideSection>

          {contacts.length > 0 && (
            <SideSection title="고객사 연락처" icon={<Contact className="size-3.5" />}>
              <p className="-mt-1 mb-3 text-xs text-slate-500">대화에서 자동으로 모았어요. 틀리면 고칠 수 있어요.</p>
              <ul className="space-y-3">
                {contacts.map(({ contact: c, channels, latest }) => (
                  <li key={c.name} className="space-y-1.5">
                    <div className="flex items-start gap-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {c.name} <span className="font-normal text-slate-500">{c.title}</span>
                        </p>
                        <p className="truncate text-xs text-slate-500">{c.role}</p>
                      </div>
                      {latest && (
                        <Link
                          href={`/inbox?thread=${latest.id}`}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs text-brand-600 hover:bg-white"
                          title="가장 최근 대화 열기"
                        >
                          <MessageSquare className="size-3.5" />
                          대화
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditingContact(c)}
                        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-600"
                        aria-label={`${c.name} 연락처 고치기`}
                        title="고치기"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {channels.map((ch) => (
                        <ChannelBadge key={ch} channel={ch} />
                      ))}
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="min-w-0 truncate text-slate-500 hover:text-brand-600">
                          {c.email}
                        </a>
                      )}
                      {c.phone && <span className="text-slate-500">{c.phone}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </SideSection>
          )}

          <SideSection
            title="회사 기준"
            icon={<BookOpen className="size-3.5" />}
            action={
              <Link href="/knowledge" className="text-xs text-brand-600 hover:underline">
                지식 베이스에서 관리
              </Link>
            }
          >
            <p className="-mt-1 mb-3 text-xs text-slate-500">이 프로젝트 문서보다 먼저, 모든 답장에 적용되는 자료예요.</p>
            <ul className="space-y-2">
              {companyDocs.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setOpenDocId(d.id)}
                    className="flex items-center gap-2 text-left text-sm hover:text-brand-600"
                  >
                    <FileText className="size-4 shrink-0 text-slate-400" />
                    {d.title}
                  </button>
                </li>
              ))}
            </ul>
          </SideSection>

          {commonDocs.length > 0 && account && (
            <SideSection
              title={`${account.name} 공통 자료`}
              icon={<Building2 className="size-3.5" />}
              action={
                <Link href={`/knowledge?account=${account.id}`} className="text-xs text-brand-600 hover:underline">
                  지식 베이스에서 관리
                </Link>
              }
            >
              <p className="-mt-1 mb-3 text-xs text-slate-500">이 회사 모든 프로젝트 답장에 함께 참고하는 자료예요.</p>
              <ul className="space-y-2">
                {commonDocs.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setOpenDocId(d.id)}
                      className="flex items-center gap-2 text-left text-sm hover:text-brand-600"
                    >
                      <FileText className="size-4 shrink-0 text-slate-400" />
                      {d.title}
                    </button>
                  </li>
                ))}
              </ul>
            </SideSection>
          )}
        </aside>
      </div>

      <UploadDialog key={id} open={uploading} onClose={() => setUploading(false)} projectId={id} />
      {memberDialog && (
        <MemberDialog
          key={memberDialog.replacing ?? "add"}
          open
          onClose={() => setMemberDialog(null)}
          project={project}
          replacing={memberDialog.replacing}
          onReplaced={(from, to) => setHandedOver({ from, to })}
        />
      )}
      {drafting && <DocDraftDialog project={project} onClose={() => setDrafting(false)} />}
      {linking && <LinkChatDialog project={project} onClose={() => setLinking(false)} />}
      {editingContact && account && (
        <ContactDialog accountId={account.id} contact={editingContact} onClose={() => setEditingContact(null)} />
      )}
      <DocPreviewModal docId={openDocId} onClose={() => setOpenDocId(null)} />
    </div>
  );
}

/**
 * 개요의 업무 현황: 먼데이에서 받아온 진행 단계·진행률·마감·우선순위·담당·금액과 남은 업무 몇 개.
 * 원본은 먼데이에 있어 여기서는 보기만 하고, 전체 업무는 업무 탭에서 본다
 */
function WorkStatus({ item, done, onShowAll }: { item?: MondayItem; done: boolean; onShowAll: () => void }) {
  const { notify } = useDemo();

  if (!item) {
    if (done) return null;
    return (
      <Card
        title="업무 현황"
        icon={<ClipboardList className="size-4 text-violet-500" />}
        action={
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <MondayDot />
            먼데이
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex-1 text-sm text-slate-500">
            먼데이와 연결되지 않은 프로젝트예요. 연결하면 진행 단계·마감·업무를 여기서 함께 봐요.
          </p>
          <Button size="sm" onClick={() => notify("데모에서는 연결 창 대신 알림만 보여요.")}>
            먼데이 아이템 연결
          </Button>
        </div>
      </Card>
    );
  }

  const open = openTasks(item).sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""));

  return (
    <Card
      title="업무 현황"
      icon={<ClipboardList className="size-4 text-violet-500" />}
      action={<OpenInMonday />}
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        <WorkField label="진행 단계">
          <StageBadge stage={item.stage} />
        </WorkField>
        <WorkField label="진행률">
          <ProgressBar value={item.progress} />
        </WorkField>
        <WorkField label="다음 마감">
          <NextDueCell item={item} />
        </WorkField>
        <WorkField label="우선순위">
          <PriorityBadge priority={item.priority} />
        </WorkField>
        <WorkField label="업무 담당자">{findStaff(item.ownerId).name}</WorkField>
        <WorkField label="예상 금액">{item.amount ? formatAmount(item.amount) : "-"}</WorkField>
      </dl>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500">남은 업무 {open.length}</p>
          <button
            type="button"
            onClick={onShowAll}
            className="inline-flex items-center text-xs text-brand-600 hover:underline"
          >
            업무 {item.tasks.length}개 전체 보기
            <ChevronRight className="size-3.5" />
          </button>
        </div>
        {open.length === 0 ? (
          <p className="text-sm text-slate-400">모든 업무가 끝났어요.</p>
        ) : (
          <ul className="space-y-1.5">
            {open.slice(0, 3).map((t) => (
              <li key={t.name} className="flex items-center gap-3 text-sm">
                <TaskStatus status={t.status} />
                <span className="min-w-0 flex-1 truncate">{t.name}</span>
                {t.due && <DueLabel iso={t.due} className="text-xs" />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function OpenInMonday() {
  const { notify } = useDemo();
  return (
    <button
      type="button"
      onClick={() => notify("데모에서는 먼데이 보드 대신 알림만 보여요.")}
      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
    >
      <MondayDot />
      먼데이에서 열기
      <ArrowUpRight className="size-3" />
    </button>
  );
}

type TaskColumnKey = "status" | "owner" | "due" | "priority" | "thread" | "note";

/** 먼데이 하위 업무 칼럼. 보드마다 다르니 기본은 적게 두고 칼럼 설정에서 켠다 */
const TASK_COLUMNS: { key: TaskColumnKey; label: string; shown: boolean }[] = [
  { key: "status", label: "상태", shown: true },
  { key: "owner", label: "담당자", shown: true },
  { key: "due", label: "마감", shown: true },
  { key: "priority", label: "우선순위", shown: false },
  { key: "thread", label: "관련 대화", shown: true },
  { key: "note", label: "메모", shown: false },
];
const TASK_COLUMN_KEYS = TASK_COLUMNS.map((c) => c.key);
const DEFAULT_TASK_COLUMNS = TASK_COLUMNS.filter((c) => c.shown).map((c) => c.key);

/** 업무 탭: 먼데이 하위 업무를 표로. 관련 대화를 누르면 수신함의 그 대화로 */
function TaskTable({ item, readable }: { item: MondayItem; readable: Thread[] }) {
  const { threads, currentUser } = useDemo();
  const [shown, toggle] = useStoredColumns("relay.task-columns", TASK_COLUMN_KEYS, DEFAULT_TASK_COLUMNS);
  const columns = TASK_COLUMNS.filter((c) => shown.includes(c.key));
  // 남은 업무를 마감 순으로 먼저, 끝난 업무는 아래로
  const tasks = [...item.tasks].sort(
    (a, b) => Number(a.status === "완료") - Number(b.status === "완료") || (a.due ?? "").localeCompare(b.due ?? ""),
  );
  const empty = <span className="text-slate-300">-</span>;

  const cell = (key: TaskColumnKey, t: MondayItem["tasks"][number]): ReactNode => {
    switch (key) {
      case "status":
        return <TaskStatus status={t.status} />;
      case "owner":
        return t.ownerId ? findStaff(t.ownerId).name : empty;
      case "due":
        if (!t.due) return empty;
        // 끝난 업무는 마감이 지났어도 빨갛게 보이지 않게
        if (t.status === "완료") {
          const d = new Date(t.due);
          return <span className="text-slate-400">{`${d.getMonth() + 1}/${d.getDate()}`}</span>;
        }
        return <DueLabel iso={t.due} />;
      case "priority":
        return t.priority ? <PriorityBadge priority={t.priority} /> : empty;
      case "thread": {
        if (!t.threadId) return empty;
        const thread = readable.find((th) => th.id === t.threadId);
        if (!thread) {
          // 다른 사람의 개인 연락이면 대화가 있다는 것만 보여 준다
          return threads.some((th) => th.id === t.threadId) ? (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Lock className="size-3" />
              개인 연락
            </span>
          ) : (
            empty
          );
        }
        return (
          <Link
            href={`/inbox?thread=${thread.id}`}
            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
          >
            <MessageSquare className="size-3.5" />
            {roomName(thread, currentUser.id)}
          </Link>
        );
      }
      case "note":
        return t.note ? <span className="text-xs text-slate-500">{t.note}</span> : empty;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <MondayDot />
          먼데이 하위 업무 {item.tasks.length} · 남은 {openTasks(item).length} · {formatDateTime(MONDAY_SYNCED_AT)} 동기화
        </p>
        <div className="ml-auto flex items-center gap-3">
          <OpenInMonday />
          <ColumnPicker columns={TASK_COLUMNS} shown={shown} onToggle={toggle} />
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs whitespace-nowrap text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">업무</th>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2.5 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.name} className="border-t border-slate-100">
                <td className={cn("px-4 py-3 font-medium", t.status === "완료" && "text-slate-400 line-through")}>
                  {t.name}
                </td>
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 whitespace-nowrap">
                    {cell(c.key, t)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">고칠 때는 먼데이에서 바꿔 주세요. 다음 동기화 때 여기에 반영돼요.</p>
    </div>
  );
}

function WorkField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="mb-1 text-xs text-slate-500">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

/** 오른쪽 옆 패널의 한 구역. 흰 카드 대신 작은 제목과 구분선만 쓴다 */
function SideSection({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function TodoList({ title, items, dot }: { title: string; items: string[]; dot: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-slate-500">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">없음</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-slate-700">
              <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", dot)} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm whitespace-nowrap",
        active ? "border-brand-600 font-medium text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
