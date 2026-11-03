"use client";

import {
  BookOpen,
  Building2,
  ChevronRight,
  ExternalLink,
  FolderKanban,
  Lightbulb,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ChannelBadge } from "@/components/common/channel-badge";
import { ProjectStatusBadge } from "@/components/common/project-status-badge";
import { DocList } from "@/components/docs/doc-list";
import { Badge } from "@/components/ui/badge";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { useDemo, visibleThreads } from "@/lib/demo-context";
import { docLayer } from "@/lib/docs";
import { PROJECT_FACTS, SIMILAR_CASES } from "@/lib/mock-data";
import { messageTags, roomName } from "@/lib/thread";
import type { Project } from "@/lib/types";
import type { Scope } from "./knowledge-tree";

export const RANGES = [
  { value: "3", label: "최근 3개월" },
  { value: "6", label: "최근 6개월" },
  { value: "12", label: "최근 12개월" },
  { value: "all", label: "전체 기간" },
];

const STATUS_ORDER: Record<Project["status"], number> = { "진행 중": 0, 대기: 1, 완료: 2 };

interface PanelProps {
  range: string;
  onSelect: (scope: Scope) => void;
  onOpenDoc: (docId: string) => void;
}

type CompanyTab = "standard" | "company" | "learned";

/**
 * 우리 회사: AI가 자료를 쓰는 법, 그리고 탭으로 회사 기준 / 회사 자료 / 대화에서 배운 것.
 * 섹션을 위아래로 쌓으면 자료가 늘수록 화면이 끝없이 길어져서 탭으로 나눈다
 */
export function CompanyPanel({ range, onRangeChange, onSelect, onOpenDoc }: PanelProps & { onRangeChange: (range: string) => void }) {
  const { docs, threads, projects, accounts, currentUser, role, learnedEdits } = useDemo();
  const [tab, setTab] = useState<CompanyTab>("standard");
  const readable = visibleThreads(threads, currentUser, role);
  const canOpen = (threadId?: string) => Boolean(threadId && readable.some((t) => t.id === threadId));
  const standard = docs.filter((d) => docLayer(d) === "standard");
  const company = docs.filter((d) => docLayer(d) === "company");
  const accountDocs = docs.filter((d) => docLayer(d) === "account").length;
  // 대화는 스페이스에 연결한 채팅방만 쌓인다
  const linkedChats = readable.filter((t) => t.projectIds.length > 0).length;

  return (
    <div className="space-y-5">
      <ScopeHeader crumbs={[]} title="우리 회사" sub="모든 고객사 답장에 공통으로 쓰는 자료와 지식이에요." />
      <HowAiAnswers
        rules={standard.length}
        facts={[
          { label: "그 스페이스 자료·대화", detail: `자료 ${docs.filter((d) => d.projectId).length} · 채팅방 ${linkedChats} · ${rangeLabel(range)}` },
          { label: "그 고객사 공통 자료", detail: `${accountDocs}개` },
          { label: "회사 자료", detail: `${company.length}개` },
        ]}
      />
      <div className="space-y-3">
        <PanelTabs
          tabs={[
            { key: "standard", label: "회사 기준", count: standard.length, icon: ShieldCheck },
            { key: "company", label: "회사 자료", count: company.length, icon: BookOpen },
            { key: "learned", label: "대화에서 배운 것", icon: MessagesSquare },
          ]}
          active={tab}
          onChange={setTab}
        />
        {tab === "standard" && (
          <>
            <Desc>말투, 응대 원칙, 할인·승인 규칙처럼 모든 답장이 지켜야 하는 규칙이에요. 단가처럼 고객사마다 달라질 수 있는 건 회사 자료로 둬요. 팀장이 정해요.</Desc>
            <DocList docs={standard} onOpen={onOpenDoc} />
          </>
        )}
        {tab === "company" && (
          <>
            <Desc>단가표, 제품 소개서, 정비 가이드처럼 질문에 맞을 때 참고해요. 고객사·스페이스에 더 구체적인 자료가 있으면 그쪽을 따라요.</Desc>
            <DocList docs={company} onOpen={onOpenDoc} />
          </>
        )}
        {tab === "learned" && (
          <>
            <Desc>스페이스 대화에서 AI가 뽑아 회사 전체에서 쓰는 지식이에요.</Desc>
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
                            <button
                              type="button"
                              onClick={() => onSelect({ kind: "project", id: project.id })}
                              className="text-slate-400 hover:text-brand-600"
                            >
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
                <Card
                  title={`사람이 고친 답장 ${learnedEdits}`}
                  desc="AI 초안을 고쳐 보낸 건이에요. 모아서 한 번에 학습하면 다음 초안이 우리 회사 말투와 기준에 더 가까워져요."
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 고객사: 그 회사 모든 스페이스에 쓰는 공통 자료와 스페이스 목록.
 * 스페이스 자료는 답장에 섞어 쓰지 않으니 여기서 모아 보이지 않고, 스페이스를 눌러 본다
 */
export function AccountPanel({ id, onSelect, onOpenDoc }: Omit<PanelProps, "range"> & { id: string }) {
  const { docs, threads, projects, accounts, currentUser, role } = useDemo();
  const account = accounts.find((a) => a.id === id);
  if (!account) return null;
  const readable = visibleThreads(threads, currentUser, role);
  const list = projects.filter((p) => p.accountId === id).sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const common = docs.filter((d) => d.accountId === id);
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
      <AlsoUses
        items={[
          { label: `회사 기준 ${docs.filter((d) => docLayer(d) === "standard").length}`, onClick: toCompany },
          { label: `회사 자료 ${docs.filter((d) => docLayer(d) === "company").length}`, onClick: toCompany },
        ]}
      />
      <Section
        icon={Building2}
        title="공통 자료"
        count={common.length}
        desc="계약 조건, 출입 수칙, 보안 요구사항처럼 여러 스페이스에 반복해 쓰는 자료예요. 이 회사 모든 스페이스 답장에 참고해요."
      >
        {common.length === 0 ? (
          <Empty>아직 없어요. 위쪽 자료 올리기에서 &ldquo;고객사 공통 자료&rdquo;로 올려요.</Empty>
        ) : (
          <DocList docs={common} onOpen={onOpenDoc} />
        )}
      </Section>
      <Section icon={FolderKanban} title="스페이스" count={list.length} desc="스페이스 자료와 대화는 그 스페이스 답장에만 써요. 눌러서 봐요.">
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
    </div>
  );
}

type SpaceTab = "docs" | "chats" | "facts" | "cases";

/** 스페이스: 함께 보는 위 단계 자료 한 줄, 그리고 탭으로 자료 / 대화 / 핵심 정보 / 해결된 사례 */
export function ProjectPanel({ id, range, onSelect, onOpenDoc }: PanelProps & { id: string }) {
  const { docs, threads, projects, accounts, currentUser, role } = useDemo();
  const [tab, setTab] = useState<SpaceTab>("docs");
  const project = projects.find((p) => p.id === id);
  const account = accounts.find((a) => a.id === project?.accountId);
  if (!project || !account) return null;
  const readable = visibleThreads(threads, currentUser, role);
  const canOpen = (threadId?: string) => Boolean(threadId && readable.some((t) => t.id === threadId));
  const projectDocs = docs.filter((d) => d.projectId === id);
  const rooms = readable.filter((t) => t.projectIds.includes(id));
  // 본인과 팀장만 볼 수 있는 개인 연락은 목록에서 빼고 수만 알려 준다
  const hidden = threads.filter((t) => t.projectIds.includes(id)).length - rooms.length;
  const facts = PROJECT_FACTS.filter((f) => f.projectId === id);
  const cases = SIMILAR_CASES.filter((c) => c.projectId === id);
  const toCompany = () => onSelect({ kind: "company" });

  return (
    <div className="space-y-5">
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
      <AlsoUses
        items={[
          { label: `회사 기준 ${docs.filter((d) => docLayer(d) === "standard").length}`, onClick: toCompany },
          { label: `회사 자료 ${docs.filter((d) => docLayer(d) === "company").length}`, onClick: toCompany },
          {
            label: `${account.name} 공통 자료 ${docs.filter((d) => d.accountId === account.id).length}`,
            onClick: () => onSelect({ kind: "account", id: account.id }),
          },
        ]}
      />
      <div className="space-y-3">
        <PanelTabs
          tabs={[
            { key: "docs", label: "자료", count: projectDocs.length, icon: BookOpen },
            { key: "chats", label: "대화", count: rooms.length, icon: MessagesSquare },
            { key: "facts", label: "핵심 정보", count: facts.length, icon: Lightbulb },
            { key: "cases", label: "해결된 사례", count: cases.length, icon: Sparkles },
          ]}
          active={tab}
          onChange={setTab}
        />
        {tab === "docs" && (
          <>
            <Desc>이 스페이스 답장에만 써요. 메일·메신저 첨부는 자동으로 쌓여요.</Desc>
            {projectDocs.length === 0 ? <Empty>아직 자료가 없어요.</Empty> : <DocList docs={projectDocs} onOpen={onOpenDoc} />}
          </>
        )}
        {tab === "chats" && (
          <>
            <Desc>연결한 채팅방에서 이 스페이스로 쌓인 메시지만 써요({rangeLabel(range)}). 개인 대화로 표시한 메시지는 빠져요.</Desc>
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
          </>
        )}
        {tab === "facts" && (
          <>
            <Desc>문서와 대화에서 뽑은 납기·금액·일정이에요. 스페이스 개요에도 보여요.</Desc>
            {facts.length === 0 ? (
              <Empty>아직 뽑은 정보가 없어요.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4">
                {facts.map((f) => (
                  <li key={f.id} className="flex items-start gap-2 py-2.5 text-sm">
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
          </>
        )}
        {tab === "cases" && (
          <>
            <Desc>이 스페이스에서 해결한 문제예요. 비슷한 문의가 오면 다른 스페이스에도 추천돼요.</Desc>
            {cases.length === 0 ? (
              <Empty>아직 없어요. 끝난 대화에서 AI가 뽑아요.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4">
                {cases.map((c) => (
                  <li key={c.id} className="py-2.5 text-sm">
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
          </>
        )}
      </div>
    </div>
  );
}

/** 범위 안의 탭. 스페이스 상세 화면 탭과 같은 모양 */
function PanelTabs<K extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: K; label: string; count?: number; icon: LucideIcon }[];
  active: K;
  onChange: (key: K) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm whitespace-nowrap",
            active === t.key ? "border-brand-600 font-medium text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700",
          )}
        >
          <t.icon className="size-4" />
          {t.label}
          {t.count !== undefined && <span className="text-xs font-normal text-slate-400">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

function Desc({ children }: { children: ReactNode }) {
  return <p className="text-xs text-slate-500">{children}</p>;
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

/**
 * 고객사·스페이스 답장에 함께 쓰는 위 단계 자료(트리에서 물려받는 것). 누르면 그 범위로 간다.
 * 단계별 순서 설명은 우리 회사에만 한 번 둔다
 */
function AlsoUses({ items }: { items: { label: string; onClick: () => void }[] }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500">
      <span>답장할 때 함께 보는 자료</span>
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          onClick={it.onClick}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600 hover:bg-brand-50 hover:text-brand-700"
        >
          {it.label}
        </button>
      ))}
    </p>
  );
}

/**
 * AI가 답장할 때 자료를 쓰는 법 (기능정리 5-3, 5-5).
 * 회사 기준은 늘 지키는 규칙이라 모든 답장에 들어가고 다른 자료보다 우선한다.
 * 나머지는 질문에 맞춰 찾는 사실 자료라, 내용이 서로 다르면 더 가까운(구체적인) 자료를 따른다
 */
function HowAiAnswers({ rules, facts }: { rules: number; facts: { label: string; detail: string }[] }) {
  return (
    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      <div className="flex items-start gap-2.5 p-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <p className="text-xs text-slate-500">
          <span className="block font-medium text-slate-700">늘 지키는 규칙 · 회사 기준 {rules}개</span>
          모든 답장에 들어가고, 다른 자료와 다르면 회사 기준을 따라요.
        </p>
      </div>
      <div className="flex items-start gap-2.5 p-3">
        <BookOpen className="mt-0.5 size-4 shrink-0 text-brand-600" />
        <div className="min-w-0 text-xs text-slate-500">
          <p>
            <span className="block font-medium text-slate-700">질문에 맞춰 찾는 자료 · 내용이 다르면 가까운 자료를 따라요</span>
            예: 고객사와 따로 맺은 단가 계약이 있으면 회사 단가표 대신 그 단가를 써요.
          </p>
          <ol className="mt-2 flex flex-wrap items-center gap-1.5">
            {facts.map((s, i) => (
              <li key={s.label} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="size-3.5 text-slate-300" />}
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="font-medium text-slate-700">{s.label}</span>
                  <span className="text-slate-400">{s.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
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
