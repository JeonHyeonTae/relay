"use client";

import { Download, FilePlus2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import { formatDate } from "@/lib/format";
import { DEMO_NOW, PROJECT_FACTS, QUOTE_ITEMS } from "@/lib/mock-data";
import type { Project } from "@/lib/types";
import { formatAmount, mondayOf } from "./monday";

type Kind = "견적서" | "계약서";

/**
 * 견적서·계약서 초안 (기능정리 2-7, 검토).
 * 단가표·표준 약관과 스페이스 핵심 정보로 AI가 초안을 만들고, 사람이 확인해 스페이스 문서로 저장한다.
 * 단가는 가까운 자료가 이긴다: 고객사와 맺은 계약 단가가 있으면 그것, 없으면 회사 표준 단가표
 */
export function DocDraftDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const { accounts, docs, addDoc, notify, logActivity, currentUser } = useDemo();
  const [kind, setKind] = useState<Kind>("견적서");
  const account = accounts.find((a) => a.id === project.accountId);
  const monday = mondayOf(project.id);
  const items = QUOTE_ITEMS[project.id] ?? (monday?.amount ? [{ name: `${project.name} 일괄`, qty: "1식", price: monday.amount }] : []);
  const total = items.reduce((sum, i) => sum + i.price, 0);
  // 금액·일정이 아닌 조건(납기, 설치 조건, 범위 등)만 계약·견적 조건으로 쓴다
  const conditions = PROJECT_FACTS.filter((f) => f.projectId === project.id && !/금액|결정권자|다음 일정|열린 요청|최근 이슈/.test(f.label));
  const priceDoc =
    docs.find((d) => d.accountId === project.accountId && d.kind === "계약서" && d.title.includes("단가")) ??
    docs.find((d) => d.id === "k3");
  const termsDoc = docs.find((d) => d.id === "k6");
  const basis = kind === "견적서" ? priceDoc : termsDoc;
  const today = formatDate(DEMO_NOW);

  const save = () => {
    addDoc({
      title: `${project.name} ${kind} 초안`,
      category: "스페이스",
      kind,
      source: "upload",
      projectId: project.id,
      updatedAt: DEMO_NOW.slice(0, 10),
      ownerId: currentUser.id,
      priority: false,
      usedCount: 0,
      summary: `AI가 ${basis?.title ?? "회사 자료"}와 핵심 정보로 만든 ${kind} 초안이에요. 보내기 전에 사람이 확인해야 해요.`,
      highlights: items.map((i) => `${i.name} ${i.qty} ${formatAmount(i.price)}`),
    });
    notify(`'${project.name} ${kind} 초안'을 문서에 저장했어요.`);
    logActivity(`'${project.name}' ${kind} 초안 만듦`);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="문서 초안 만들기"
      description="단가표·표준 약관과 이 스페이스의 핵심 정보로 AI가 초안을 만들어요. 고객사와 맺은 계약 단가가 있으면 그 단가를 써요. 보내기 전에 꼭 확인해 주세요."
      footer={
        <>
          <Button onClick={() => notify("데모에서는 내려받기 대신 알림만 보여요.")}>
            <Download className="size-4" />
            내려받기
          </Button>
          <Button variant="primary" onClick={save} disabled={items.length === 0}>
            <FilePlus2 className="size-4" />
            스페이스 문서로 저장
          </Button>
        </>
      }
    >
      <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 text-sm">
        {(["견적서", "계약서"] as Kind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn("flex-1 rounded-md py-1.5", kind === k ? "bg-white font-medium shadow-sm" : "text-slate-500")}
          >
            {k}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
          금액 정보가 없어 초안을 만들 수 없어요. 먼데이에 예상 금액을 넣거나 견적 자료를 올려 주세요.
        </p>
      ) : (
        <div className="space-y-4 rounded-xl border border-slate-200 p-5 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{kind}</p>
              <p className="text-slate-500">{project.name}</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>{today}</p>
              <p>{kind === "견적서" ? "유효기간 30일" : "계약 기간 1년"}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-slate-500">{kind === "견적서" ? "받는 곳" : "고객"}</dt>
              <dd className="text-sm font-medium">{account?.name} 귀중</dd>
            </div>
            <div>
              <dt className="text-slate-500">{kind === "견적서" ? "보내는 곳" : "공급자"}</dt>
              <dd className="text-sm font-medium">우리 회사 · {currentUser.name}</dd>
            </div>
          </dl>

          <table className="w-full">
            <thead className="border-b border-slate-200 text-left text-xs text-slate-500">
              <tr>
                <th className="py-1.5 font-medium">품목</th>
                <th className="py-1.5 font-medium">수량</th>
                <th className="py-1.5 text-right font-medium">금액</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.name} className="border-b border-slate-100">
                  <td className="py-2">{i.name}</td>
                  <td className="py-2 text-slate-500">{i.qty}</td>
                  <td className="py-2 text-right tabular-nums">{formatAmount(i.price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-2 font-medium">
                  {kind === "견적서" ? "합계 (VAT 별도)" : "계약 금액 (VAT 별도)"}
                </td>
                <td className="pt-2 text-right font-semibold tabular-nums">{formatAmount(total)}</td>
              </tr>
            </tfoot>
          </table>

          {(conditions.length > 0 || kind === "계약서") && (
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-500">{kind === "견적서" ? "조건" : "주요 조건"}</p>
              <ul className="space-y-0.5">
                {conditions.map((f) => (
                  <li key={f.id}>
                    · {f.label}: {f.value}
                  </li>
                ))}
                {kind === "계약서" &&
                  termsDoc?.highlights.map((h) => (
                    <li key={h}>· {h} (표준 약관)</li>
                  ))}
              </ul>
            </div>
          )}

          {kind === "계약서" && (
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-400">
              <p className="border-t border-slate-200 pt-2">공급자 서명</p>
              <p className="border-t border-slate-200 pt-2">고객 서명</p>
            </div>
          )}
        </div>
      )}

      <p className="flex items-start gap-1.5 text-xs text-slate-500">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
        <span>
          근거: {basis?.title} ({basis?.accountId ? `${account?.name} 공통 자료` : "회사 자료"}), 이 스페이스 핵심 정보 {conditions.length}개
          {monday?.amount ? ", 먼데이 예상 금액" : ""}
        </span>
      </p>
    </Modal>
  );
}
