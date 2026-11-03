"use client";

import { Upload, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { DocPreviewModal } from "@/components/docs/doc-preview-modal";
import { DocTable } from "@/components/docs/doc-table";
import { UploadDialog } from "@/components/docs/upload-dialog";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import { docLayer, isStale, type DocLayer } from "@/lib/docs";
import { KnowledgeTree, type Scope } from "./knowledge-tree";
import { AccountPanel, CompanyPanel, ProjectPanel } from "./scope-panels";

const LAYER_ORDER: Record<DocLayer, number> = { standard: 0, company: 1, project: 2 };

/**
 * 지식 베이스: AI가 답장할 때 참고하는 자료를 우리 회사 → 고객사·협력사 → 회사 → 프로젝트 구조로 정리해 보는 곳.
 * 이 구조가 곧 AI가 자료를 찾는 범위다. 자료가 틀리면 AI 답장도 틀린다
 */
export function KnowledgeView() {
  const { docs, team } = useDemo();
  const searchParams = useSearchParams();
  const [scope, setScope] = useState<Scope>({ kind: "company" });
  const [range, setRange] = useState("6");
  const [uploading, setUploading] = useState(false);
  const [openDocId, setOpenDocId] = useState<string | null>(searchParams.get("doc"));
  const [query, setQuery] = useState("");
  const [staleOnly, setStaleOnly] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const stale = docs.filter((d) => isStale(d, team.staleMonths));
  const q = query.trim().toLowerCase();
  // 검색과 최신화가 필요한 자료는 회사·프로젝트를 가리지 않고 모아 본다
  const finding = q !== "" || staleOnly;
  const found = docs
    .filter((d) => !staleOnly || isStale(d, team.staleMonths))
    .filter((d) => !q || [d.title, d.summary, d.kind].some((t) => t.toLowerCase().includes(q)))
    // 답장에 먼저 쓰이는 자료가 위로, 같은 단계에서는 최근에 바뀐 순
    .sort((a, b) => LAYER_ORDER[docLayer(a)] - LAYER_ORDER[docLayer(b)] || b.updatedAt.localeCompare(a.updatedAt));

  const select = (next: Scope) => {
    setScope(next);
    setQuery("");
    setStaleOnly(false);
    // 아래로 내려 본 상태에서 고르면 새 범위의 위쪽부터 보여 준다
    if ((panelRef.current?.getBoundingClientRect().top ?? 0) < 0) panelRef.current?.scrollIntoView({ block: "start" });
  };
  const clearFinding = () => {
    setQuery("");
    setStaleOnly(false);
  };
  const panelProps = { range, onSelect: select, onOpenDoc: setOpenDocId };

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="지식 베이스"
        description="AI가 답장할 때 참고하는 자료를 회사·프로젝트별로 정리해 둔 곳이에요. 자료가 틀리거나 오래되면 AI 답장도 틀려요."
        actions={
          <Button variant="primary" onClick={() => setUploading(true)}>
            <Upload className="size-4" />
            자료 올리기
          </Button>
        }
      />

      <div className="mx-8 grid items-start gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="space-y-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <SearchInput value={query} onChange={setQuery} placeholder="모든 자료에서 검색" className="sm:w-full" />
          {/* 알림으로 띄우지 않고, 필요할 때 오래된 자료만 골라 볼 수 있게 */}
          {stale.length > 0 && (
            <button
              type="button"
              onClick={() => setStaleOnly((v) => !v)}
              aria-pressed={staleOnly}
              className={cn(
                "w-full rounded-lg border px-3 py-1.5 text-left text-xs",
                staleOnly ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-500 hover:text-amber-700",
              )}
            >
              최신화가 필요한 자료 {stale.length}개
            </button>
          )}
          <KnowledgeTree scope={scope} onSelect={select} />
        </div>

        <div ref={panelRef} className="min-w-0 scroll-mt-4">
          {finding ? (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">
                  {staleOnly ? `${team.staleMonths}개월 넘게 바뀌지 않은 자료` : "검색 결과"}
                  <span className="ml-1.5 text-sm font-normal text-slate-400">{found.length}</span>
                </h2>
                <button type="button" onClick={clearFinding} className="inline-flex items-center gap-0.5 text-xs text-brand-600 hover:underline">
                  <X className="size-3" />
                  닫기
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {staleOnly
                  ? "“최신화 요청”을 누르면 자료를 올린 사람에게 알림이 가요."
                  : "회사 자료와 모든 프로젝트 자료에서 찾았어요. 프로젝트 자료는 프로젝트 이름이 함께 보여요."}
              </p>
              <DocTable docs={found} onOpen={setOpenDocId} showProject />
            </section>
          ) : scope.kind === "company" ? (
            <CompanyPanel {...panelProps} onRangeChange={setRange} />
          ) : scope.kind === "account" ? (
            <AccountPanel id={scope.id} onSelect={select} onOpenDoc={setOpenDocId} />
          ) : (
            <ProjectPanel id={scope.id} {...panelProps} />
          )}
        </div>
      </div>

      {/* 프로젝트를 보고 있으면 그 프로젝트 자료로 올린다 */}
      <UploadDialog
        key={scope.kind === "project" ? scope.id : "company"}
        open={uploading}
        onClose={() => setUploading(false)}
        projectId={scope.kind === "project" ? scope.id : undefined}
      />
      <DocPreviewModal docId={openDocId} onClose={() => setOpenDocId(null)} />
    </div>
  );
}
