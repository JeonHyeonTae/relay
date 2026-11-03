"use client";

import {
  BookOpen,
  Building2,
  ChevronRight,
  ExternalLink,
  FolderKanban,
  MessagesSquare,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChannelBadge } from "@/components/common/channel-badge";
import { ProjectStatusBadge } from "@/components/common/project-status-badge";
import { DocTable } from "@/components/docs/doc-table";
import { Badge } from "@/components/ui/badge";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { useDemo, visibleThreads } from "@/lib/demo-context";
import { docLayer } from "@/lib/docs";
import { PROJECT_FACTS, SIMILAR_CASES } from "@/lib/mock-data";
import { messageTags, roomName } from "@/lib/thread";
import type { KnowledgeDoc, Project } from "@/lib/types";
import type { Scope } from "./knowledge-tree";

export const RANGES = [
  { value: "3", label: "최근 3개월" },
  { value: "6", label: "최근 6개월" },
  { value: "12", label: "최근 12개월" },
  { value: "all", label: "전체 기간" },
];

const STATUS_ORDER: Record<Project["status"], number> = { "진행 중": 0, 대기: 1, 완료: 2 };

const recent = (a: KnowledgeDoc, b: KnowledgeDoc) => b.updatedAt.localeCompare(a.updatedAt);

interface PanelProps {
  range: string;
  onSelect: (scope: Scope) => void;
  onOpenDoc: (docId: string) => void;
}

/** 우리 회사: 모든 답장에 공통으로 쓰는 회사 기준·회사 자료, 대화에서 배워 회사 전체에서 쓰는 지식 */
export function CompanyPanel({ range, onRangeChange, onSelect, onOpenDoc }: PanelProps & { onRangeChange: (range: string) => void }) {
  const { docs, threads, projects, accounts, currentUser, role, learnedEdits } = useDemo();
  const readable = visibleThreads(threads, currentUser, role);
  const canOpen = (threadId?: string) => Boolean(threadId && readable.some((t) => t.id === threadId));
  const standard = docs.filter((d) => docLayer(d) === "standard").sort(recent);
  const company = docs.filter((d) => docLayer(d) === "company").sort(recent);
  const accountDocs = docs.filter((d) => docLayer(d) === "account").length;
  // 대화는 스페이스에 연결한 채팅방만 쌓인다
  const linkedChats = readable.filter((t) => t.projectIds.length > 0).length;

  return (
    <div className="space-y-6">
      <ScopeHeader crumbs={[]} title="우리 회사" sub="모든 고객사 답장에 공통으로 쓰는 자료와 지식이에요." />
      <SearchOrder
        title="AI가 답장할 때 보는 순서"
        steps={[
          { label: "회사 기준", detail: `${standard.length}개` },
          { label: "회사 자료", detail: `${company.length}개` },
          { label: "고객사 공통 자료", detail: `${accountDocs}개 · 그 회사에만` },
          { label: "스페이스 자료", detail: `${docs.filter((d) => d.projectId).length}개 · 그 스페이스에만` },
          { label: "스페이스 대화", detail: `채팅방 ${linkedChats} · ${rangeLabel(range)}` },
        ]}
        note="앞 단계가 먼저 적용되고, 내용이 서로 다르면 앞 단계를 따라요. 고객사 공통 자료, 스페이스 자료와 대화는 왼쪽에서 회사·스페이스를 골라 봐요."
      />
      <Section icon={ShieldCheck} title="회사 기준" count={standard.length} desc="말투, 응대 원칙, 단가처럼 모든 답장이 지켜야 하는 자료예요. 팀장이 정해요.">
        <DocTable docs={standard} onOpen={onOpenDoc} />
      </Section>
      <Section icon={BookOpen} title="회사 자료" count={company.length} desc="제품 소개서, 정비 가이드처럼 질문에 맞을 때 참고해요.">
        <DocTable docs={company} onOpen={onOpenDoc} />
      </Section>
      <Section icon={MessagesSquare} title="대화에서 배운 것" desc="스페이스 대화에서 AI가 뽑아 회사 전체에서 쓰는 지식이에요.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={`해결된 사례 ${SIMILAR_CASES.length}`} desc="끝난 대화에서 뽑은 문제와 해결 방법이에요. 비슷한 문의가 오면 다른 고객사 건에도 추천돼요.">
            <ul className="divide-y divide-slate-100">
              {SIMILAR_CASES.map((c) => {
                const project = projects.find((p) => p.id === c.projectId);
                const account = accounts.find((a) => a.id === project?.accountId);
                return (
                  <li key={c.id} className="py-2 text-sm">
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-slate-500">{c.resolution}</p>
                    <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs">
                      {project && (
                        <button type="button" onClick={() => onSelect({ kind: "project", id: project.id })} className="text-slate-400 hover:text-brand-600">
                          {account?.name} › {project.name}
                        </button>
                      )}
                      {canOpen(c.threadId) && (
                        <Link href={`/inbox?thread=${c.threadId}`} className="text-brand-600 hover:underline">
                          당시 대화
                        </Link>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Card>
          <div className="space-y-4">
            <Card title="AI가 찾아볼 대화 기간" desc="오래된 대화는 지금과 조건이 다를 수 있어요. 기간을 줄이면 최근 대화만 찾아봐요.">
              <select
                aria-label="AI가 찾아볼 대화 기간"
                value={range}
                onChange={(e) => onRangeChange(e.target.value)}
                className={cn(inputClass, "sm:w-48")}
              >
                {RANGES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Card>
            <Card title={`사람이 고친 답장 ${learnedEdits}`} desc="AI 초안을 고쳐 보낸 건이에요. 모아서 한 번에 학습하면 다음 초안이 우리 회사 말투와 기준에 더 가까워져요." />
          </div>
        </div>
      </Section>
    </div>
  );
}

/** 고객사: 그 회사 모든 스페이스에 쓰는 공통 자료, 스페이스들, 스페이스별로 쌓인 자료 */
export function AccountPanel({ id, onSelect, onOpenDoc }: Omit<PanelProps, "range"> & { id: string }) {
  const { docs, threads, projects, accounts, currentUser, role } = useDemo();
  const account = accounts.find((a) => a.id === id);
  if (!account) return null;
  const readable = visibleThreads(threads, currentUser, role);
  const list = projects.filter((p) => p.accountId === id).sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const common = docs.filter((d) => d.accountId === id).sort(recent);
  const projectDocs = docs.filter((d) => list.some((p) => p.id === d.projectId)).sort(recent);
  const toCompany = () => onSelect({ kind: "company" });

  return (
    <div className="space-y-6">
      <ScopeHeader
        crumbs={[{ label: "우리 회사", onClick: toCompany }, { label: "고객사" }]}
        title={account.name}
        badges={<Badge>{account.industry}</Badge>}
        action={
          <Link href={`/clients/${account.id}`} className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
            고객사 화면
            <ExternalLink className="size-3" />
          </Link>
        }
      />
      <SearchOrder
        title={`${account.name} 스페이스 답장에 AI가 찾아보는 순서`}
        steps={[
          { label: "회사 기준", detail: `${docs.filter((d) => docLayer(d) === "standard").length}개`, onClick: toCompany },
          { label: "회사 자료", detail: `${docs.filter((d) => docLayer(d) === "company").length}개`, onClick: toCompany },
          { label: "이 회사 공통 자료", detail: `${common.length}개` },
          { label: "그 스페이스 자료", detail: "답하는 스페이스만" },
          { label: "그 스페이스 대화", detail: "답하는 스페이스만" },
        ]}
        note="같은 회사라도 다른 스페이스 자료는 섞지 않아요. 여러 스페이스에 반복해 쓰는 자료는 공통 자료로 올려요."
      />
      <Section
        icon={Building2}
        title="공통 자료"
        count={common.length}
        desc="계약 조건, 출입 수칙, 보안 요구사항처럼 이 회사 모든 스페이스 답장에 참고하는 자료예요."
      >
        {common.length === 0 ? (
          <Empty>아직 없어요. 위쪽 자료 올리기에서 &ldquo;고객사 공통 자료&rdquo;로 올려요.</Empty>
        ) : (
          <DocTable docs={common} onOpen={onOpenDoc} />
        )}
      </Section>
      <Section icon={FolderKanban} title="스페이스" count={list.length}>
        {list.length === 0 ? (
          <Empty>아직 스페이스가 없어요.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => {
              const rooms = readable.filter((t) => t.projectIds.includes(p.id)).length;
              const stats = [
                `자료 ${docs.filter((d) => d.projectId === p.id).length}`,
                `채팅방 ${rooms}`,
                `핵심 정보 ${PROJECT_FACTS.filter((f) => f.projectId === p.id).length}`,
                `해결된 사례 ${SIMILAR_CASES.filter((c) => c.projectId === p.id).length}`,
              ];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect({ kind: "project", id: p.id })}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-brand-300"
                >
                  <span className="flex w-full items-start gap-2">
                    <span className="min-w-0 flex-1 text-sm font-medium">{p.name}</span>
                    <ProjectStatusBadge status={p.status} />
                  </span>
                  <span className="text-xs text-slate-500">{stats.join(" · ")}</span>
                </button>
              );
            })}
          </div>
        )}
      </Section>
      <Section icon={BookOpen} title="스페이스 자료 모아 보기" count={projectDocs.length} desc="스페이스마다 쌓인 자료를 한 번에 봐요.">
        <DocTable docs={projectDocs} onOpen={onOpenDoc} showProject />
      </Section>
    </div>
  );
}

/** 스페이스: 이 스페이스 답장에 AI가 찾아보는 범위와, 거기 쌓인 자료·대화·핵심 정보·해결된 사례 */
export function ProjectPanel({ id, range, onSelect, onOpenDoc }: PanelProps & { id: string }) {
  const { docs, threads, projects, accounts, currentUser, role } = useDemo();
  const project = projects.find((p) => p.id === id);
  const account = accounts.find((a) => a.id === project?.accountId);
  if (!project || !account) return null;
  const readable = visibleThreads(threads, currentUser, role);
  const canOpen = (threadId?: string) => Boolean(threadId && readable.some((t) => t.id === threadId));
  const projectDocs = docs.filter((d) => d.projectId === id).sort(recent);
  const rooms = readable.filter((t) => t.projectIds.includes(id));
  // 본인과 팀장만 볼 수 있는 개인 연락은 목록에서 빼고 수만 알려 준다
  const hidden = threads.filter((t) => t.projectIds.includes(id)).length - rooms.length;
  const facts = PROJECT_FACTS.filter((f) => f.projectId === id);
  const cases = SIMILAR_CASES.filter((c) => c.projectId === id);
  const toCompany = () => onSelect({ kind: "company" });

  return (
    <div className="space-y-6">
      <ScopeHeader
        crumbs={[
          { label: "우리 회사", onClick: toCompany },
          { label: "고객사" },
          { label: account.name, onClick: () => onSelect({ kind: "account", id: account.id }) },
        ]}
        title={project.name}
        badges={<ProjectStatusBadge status={project.status} />}
        action={
          <Link href={`/spaces/${project.id}`} className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
            스페이스 열기
            <ExternalLink className="size-3" />
          </Link>
        }
      />
      <SearchOrder
        title="이 스페이스 답장에 AI가 찾아보는 순서"
        steps={[
          { label: "회사 기준", detail: `${docs.filter((d) => docLayer(d) === "standard").length}개`, onClick: toCompany },
          { label: "회사 자료", detail: `${docs.filter((d) => docLayer(d) === "company").length}개`, onClick: toCompany },
          {
            label: `${account.name} 공통 자료`,
            detail: `${docs.filter((d) => d.accountId === account.id).length}개`,
            onClick: () => onSelect({ kind: "account", id: account.id }),
          },
          { label: "이 스페이스 자료", detail: `${projectDocs.length}개` },
          { label: "이 스페이스 대화", detail: `채팅방 ${rooms.length} · ${rangeLabel(range)}` },
        ]}
        note="비슷한 문의가 오면 다른 스페이스의 해결된 사례도 찾아봐요."
      />
      <Section icon={BookOpen} title="스페이스 자료" count={projectDocs.length} desc="이 스페이스 답장에만 써요. 메일·메신저 첨부는 자동으로 쌓여요.">
        <DocTable docs={projectDocs} onOpen={onOpenDoc} />
      </Section>
      <Section icon={MessagesSquare} title="대화" count={rooms.length} desc="연결한 채팅방에서 이 스페이스로 쌓인 메시지만 써요. 개인 대화로 표시한 메시지는 빠져요.">
        {rooms.length === 0 ? (
          <Empty>연결한 채팅방이 없어요. 스페이스 화면의 채팅방 탭에서 연결해요.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {rooms.map((t) => {
              const stored = t.messages.filter((m) => messageTags(t, m).includes(id)).length;
              return (
                <li key={t.id}>
                  <Link href={`/inbox?thread=${t.id}`} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">
                    <ChannelBadge channel={t.channel} />
                    <span className="min-w-0 flex-1 truncate font-medium">{roomName(t, currentUser.id)}</span>
                    {t.projectIds.length > 1 && (
                      <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">다른 스페이스 {t.projectIds.length - 1}곳과 함께</span>
                    )}
                    <span className="shrink-0 text-xs text-slate-500">
                      쌓인 메시지 {stored}/{t.messages.length}
                    </span>
                    <ChevronRight className="size-3.5 shrink-0 text-slate-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {hidden > 0 && <p className="text-xs text-slate-400">채팅방 {hidden}개는 본인과 팀장만 볼 수 있어요.</p>}
      </Section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={`핵심 정보 ${facts.length}`} desc="문서와 대화에서 뽑은 납기·금액·일정이에요. 스페이스 개요에도 보여요.">
          {facts.length === 0 ? (
            <p className="text-xs text-slate-400">아직 뽑은 정보가 없어요.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {facts.map((f) => (
                <li key={f.id} className="flex items-start gap-2 py-2 text-sm">
                  <p className="min-w-0 flex-1">
                    <span className="text-slate-500">{f.label}</span> {f.value}
                  </p>
                  {f.docId ? (
                    <button type="button" onClick={() => onOpenDoc(f.docId!)} className="shrink-0 text-xs text-brand-600 hover:underline">
                      문서
                    </button>
                  ) : (
                    canOpen(f.threadId) && (
                      <Link href={`/inbox?thread=${f.threadId}`} className="shrink-0 text-xs text-brand-600 hover:underline">
                        대화
                      </Link>
                    )
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={`해결된 사례 ${cases.length}`} desc="이 스페이스에서 해결한 문제예요. 비슷한 문의가 오면 다른 스페이스에도 추천돼요.">
          {cases.length === 0 ? (
            <p className="text-xs text-slate-400">아직 없어요. 끝난 대화에서 AI가 뽑아요.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cases.map((c) => (
                <li key={c.id} className="py-2 text-sm">
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-slate-500">{c.resolution}</p>
                  {canOpen(c.threadId) && (
                    <Link href={`/inbox?thread=${c.threadId}`} className="text-xs text-brand-600 hover:underline">
                      당시 대화
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function rangeLabel(range: string) {
  return RANGES.find((r) => r.value === range)?.label ?? "";
}

/** 위쪽: 어디에 있는지(우리 회사 › 고객사 › 회사)와 이 범위의 이름 */
function ScopeHeader({
  crumbs,
  title,
  sub,
  badges,
  action,
}: {
  crumbs: { label: string; onClick?: () => void }[];
  title: string;
  sub?: string;
  badges?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="space-y-1">
      {crumbs.length > 0 && (
        <p className="flex flex-wrap items-center gap-1 text-xs text-slate-400">
          {crumbs.map((c, i) => (
            <span key={c.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3" />}
              {c.onClick ? (
                <button type="button" onClick={c.onClick} className="hover:text-brand-600">
                  {c.label}
                </button>
              ) : (
                c.label
              )}
            </span>
          ))}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {badges}
        {action && <span className="ml-auto">{action}</span>}
      </div>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

/** AI가 이 범위에서 답장할 때 찾아보는 순서. 앞 단계가 먼저 적용되고, 서로 다르면 앞 단계를 따른다 (기능정리 5-3, 5-5) */
function SearchOrder({
  title,
  steps,
  note,
}: {
  title: string;
  steps: { label: string; detail: string; onClick?: () => void }[];
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium text-slate-600">{title}</p>
      <ol className="mt-2 flex flex-wrap items-center gap-1.5">
        {steps.map((s, i) => {
          const body = (
            <>
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
                {i + 1}
              </span>
              <span className="font-medium text-slate-700">{s.label}</span>
              <span className="text-slate-400">{s.detail}</span>
            </>
          );
          const chip = "inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-xs";
          return (
            <li key={s.label} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3.5 text-slate-300" />}
              {s.onClick ? (
                <button type="button" onClick={s.onClick} className={cn(chip, "hover:bg-brand-50")}>
                  {body}
                </button>
              ) : (
                <span className={chip}>{body}</span>
              )}
            </li>
          );
        })}
      </ol>
      {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  count,
  desc,
  children,
}: {
  icon: LucideIcon;
  title: string;
  count?: number;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Icon className="size-4 self-center text-brand-600" />
          {title}
          {count !== undefined && <span className="font-normal text-slate-400">{count}</span>}
        </h3>
        {desc && <p className="text-xs text-slate-500">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

function Card({ title, desc, children }: { title: string; desc?: string; children?: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="mb-1 text-sm font-semibold">{title}</h4>
      {desc && <p className={cn("text-xs text-slate-500", children !== undefined && "mb-3")}>{desc}</p>}
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">{children}</p>;
}
