"use client";

import {
  BookOpen,
  ChevronRight,
  FolderKanban,
  MessagesSquare,
  ShieldCheck,
  Upload,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { DocPreviewModal } from "@/components/docs/doc-preview-modal";
import { DocTable } from "@/components/docs/doc-table";
import { UploadDialog } from "@/components/docs/upload-dialog";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/cn";
import { useDemo, visibleThreads } from "@/lib/demo-context";
import { docLayer, isStale, type DocLayer } from "@/lib/docs";
import { PROJECT_FACTS, SIMILAR_CASES } from "@/lib/mock-data";

type View = "all" | DocLayer | "chats" | "stale";

/** AI가 답장을 쓸 때 자료를 보는 순서. 앞 단계가 먼저 적용되고, 서로 다르면 앞 단계를 따른다 (기능정리 5-3, 5-5) */
const STEPS: { key: DocLayer | "chats"; title: string; desc: string; icon: LucideIcon }[] = [
  { key: "standard", title: "회사 기준", desc: "모든 답장에 먼저 적용", icon: ShieldCheck },
  { key: "company", title: "회사 자료", desc: "질문에 맞을 때 참고", icon: BookOpen },
  { key: "project", title: "프로젝트 자료", desc: "그 프로젝트 답장에만", icon: FolderKanban },
  { key: "chats", title: "대화 내역", desc: "쌓인 대화와 거기서 뽑은 지식", icon: MessagesSquare },
];

const LAYER_ORDER: Record<DocLayer, number> = { standard: 0, company: 1, project: 2 };

const RANGES = [
  { value: "3", label: "최근 3개월" },
  { value: "6", label: "최근 6개월" },
  { value: "12", label: "최근 12개월" },
  { value: "all", label: "전체 기간" },
];

/**
 * 지식 베이스: AI가 답장할 때 무엇을 어떤 순서로 참고하는지 보고,
 * 틀리거나 낡은 자료를 바로잡는 곳. 자료가 틀리면 AI 답장도 틀린다.
 */
export function KnowledgeView() {
  const { docs, threads, currentUser, role, team } = useDemo();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("all");
  const [range, setRange] = useState("6");
  const [uploading, setUploading] = useState(false);
  const [openDocId, setOpenDocId] = useState<string | null>(searchParams.get("doc"));
  const [query, setQuery] = useState("");

  const stale = docs.filter((d) => isStale(d, team.staleMonths));
  // 대화는 프로젝트에 연결한 채팅방만 쌓인다
  const countOf = (key: DocLayer | "chats") =>
    key === "chats"
      ? visibleThreads(threads, currentUser, role).filter((t) => t.projectIds.length > 0).length
      : docs.filter((d) => docLayer(d) === key).length;
  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? "";

  const q = query.trim().toLowerCase();
  const list = docs
    .filter((d) => (view === "stale" ? isStale(d, team.staleMonths) : view === "all" || docLayer(d) === view))
    .filter((d) => !q || [d.title, d.summary, d.kind].some((t) => t.toLowerCase().includes(q)))
    // 답장에 먼저 쓰이는 자료가 위로, 같은 단계에서는 최근에 바뀐 순
    .sort((a, b) => LAYER_ORDER[docLayer(a)] - LAYER_ORDER[docLayer(b)] || b.updatedAt.localeCompare(a.updatedAt));

  const listTitle =
    view === "all"
      ? "모든 자료"
      : view === "stale"
        ? `${team.staleMonths}개월 넘게 바뀌지 않은 자료`
        : STEPS.find((s) => s.key === view)?.title;

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="지식 베이스"
        description="AI가 답장을 쓸 때 참고하는 자료를 관리하는 곳이에요. 자료가 틀리거나 오래되면 AI 답장도 틀려요."
        actions={
          <Button variant="primary" onClick={() => setUploading(true)}>
            <Upload className="size-4" />
            자료 올리기
          </Button>
        }
      />

      <section className="mx-8 space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h2 className="text-sm font-semibold">AI가 답장할 때 보는 순서</h2>
          <p className="text-xs text-slate-500">앞 단계가 먼저 적용되고, 내용이 서로 다르면 앞 단계를 따라요. 눌러서 자료를 봐요.</p>
        </div>
        <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const active = view === step.key;
            return (
              <li key={step.key} className="relative">
                <button
                  type="button"
                  onClick={() => setView(active ? "all" : step.key)}
                  aria-pressed={active}
                  className={cn(
                    "flex h-full w-full items-start gap-3 rounded-xl border bg-white p-3 text-left transition-colors",
                    active ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200 hover:border-brand-300",
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <span className="text-xs text-slate-400">{i + 1}</span>
                      {step.title}
                      <span className="ml-auto text-xs font-normal text-slate-400">
                        {step.key === "chats" ? `대화 ${countOf(step.key)}` : `${countOf(step.key)}개`}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {step.key === "chats" ? `${step.desc} · ${rangeLabel}` : step.desc}
                    </span>
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="absolute top-1/2 -right-2.5 z-10 hidden size-4 -translate-y-1/2 text-slate-300 xl:block" />
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mx-8 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold">{listTitle}</h2>
          {view !== "all" && (
            <button type="button" onClick={() => setView("all")} className="text-xs text-brand-600 hover:underline">
              모든 자료 보기
            </button>
          )}
          {/* 알림으로 띄우지 않고, 필요할 때 오래된 자료만 골라 볼 수 있게 */}
          {view !== "stale" && view !== "chats" && stale.length > 0 && (
            <button type="button" onClick={() => setView("stale")} className="text-xs text-slate-500 hover:text-brand-600">
              최신화가 필요한 자료 {stale.length}개만 보기
            </button>
          )}
          {view !== "chats" && (
            <SearchInput value={query} onChange={setQuery} placeholder="자료 이름·내용 검색" className="ml-auto" />
          )}
        </div>

        {view === "chats" ? (
          <ChatsLayer range={range} onRangeChange={setRange} />
        ) : (
          <>
            {view === "standard" && (
              <p className="text-xs text-slate-500">
                말투, 응대 원칙, 단가처럼 모든 답장이 지켜야 하는 자료예요. 회사 기준은 팀장이 정해요. 자료를 눌러 켜고 끌 수 있어요.
              </p>
            )}
            {view === "stale" && (
              <p className="text-xs text-slate-500">
                &ldquo;최신화 요청&rdquo;을 누르면 자료를 올린 사람에게 알림이 가요.
              </p>
            )}
            <DocTable docs={list} onOpen={setOpenDocId} showProject />
          </>
        )}
      </section>

      <UploadDialog open={uploading} onClose={() => setUploading(false)} />
      <DocPreviewModal docId={openDocId} onClose={() => setOpenDocId(null)} />
    </div>
  );
}

/**
 * ④ 대화 내역: 대화는 올리는 게 아니라 쌓인다. 여기서는 대화에서 AI가 뽑아 쌓은 지식(해결된 사례,
 * 핵심 정보, 고친 답장)을 보여 주고, AI가 얼마나 지난 대화까지 찾을지 정한다 (기능정리 5-4)
 */
function ChatsLayer({ range, onRangeChange }: { range: string; onRangeChange: (range: string) => void }) {
  const { threads, projects, accounts, currentUser, role, learnedEdits } = useDemo();
  const readable = visibleThreads(threads, currentUser, role);
  const canOpen = (threadId?: string) => Boolean(threadId && readable.some((t) => t.id === threadId));
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "";
  const accountName = (projectId: string) =>
    accounts.find((a) => a.id === projects.find((p) => p.id === projectId)?.accountId)?.name ?? "";
  // 대화에서 뽑은 핵심 정보 (내가 볼 수 있는 대화만)
  const facts = PROJECT_FACTS.filter((f) => f.threadId && canOpen(f.threadId));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="min-w-0 flex-1 text-sm text-slate-700">
          프로젝트에 연결한 채팅방의 대화가 프로젝트별로 쌓이고, AI가 그 안에서 쓸 만한 지식을 뽑아 둬요.
          <span className="block text-xs text-slate-500">
            대화 원문은 각 프로젝트의 소통 내역에서 볼 수 있어요. 개인 대화로 표시한 메시지는 쌓지 않아요.
          </span>
        </p>
        <div className="w-full sm:w-48">
          <label htmlFor="chat-range" className="text-xs font-medium text-slate-600">
            AI가 찾아볼 대화 기간
          </label>
          <select id="chat-range" value={range} onChange={(e) => onRangeChange(e.target.value)} className={cn(inputClass, "mt-1")}>
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-1 text-sm font-semibold">해결된 사례 {SIMILAR_CASES.length}</h3>
          <p className="mb-3 text-xs text-slate-500">끝난 대화에서 뽑은 문제와 해결 방법이에요. 비슷한 문의가 오면 수신함에서 추천돼요.</p>
          <ul className="divide-y divide-slate-100">
            {SIMILAR_CASES.map((c) => (
              <li key={c.id} className="py-2 text-sm">
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-slate-500">
                  {accountName(c.projectId)} · {c.resolution}
                </p>
                {canOpen(c.threadId) && (
                  <Link href={`/inbox?thread=${c.threadId}`} className="text-xs text-brand-600 hover:underline">
                    당시 대화
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-1 text-sm font-semibold">대화에서 뽑은 핵심 정보 {facts.length}</h3>
            <p className="mb-3 text-xs text-slate-500">납기·요청·일정처럼 대화에서 나온 정보예요. 프로젝트 개요의 핵심 정보에도 보여요.</p>
            <ul className="divide-y divide-slate-100">
              {facts.map((f) => (
                <li key={f.id} className="flex items-start gap-2 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p>
                      <span className="text-slate-500">{f.label}</span> {f.value}
                    </p>
                    <p className="text-xs text-slate-400">{projectName(f.projectId)}</p>
                  </div>
                  <Link href={`/inbox?thread=${f.threadId}`} className="shrink-0 text-xs text-brand-600 hover:underline">
                    대화
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-1 text-sm font-semibold">사람이 고친 답장 {learnedEdits}</h3>
            <p className="text-xs text-slate-500">
              AI 초안을 고쳐 보낸 건이에요. 모아서 한 번에 학습하면 다음 초안이 우리 회사 말투와 기준에 더 가까워져요.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
