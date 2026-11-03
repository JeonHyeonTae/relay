"use client";

import { useState } from "react";
import { FileDrop } from "@/components/common/file-drop";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import type { DocLayer } from "@/lib/docs";
import { DEMO_NOW } from "@/lib/mock-data";
import type { DocKind, KnowledgeCategory } from "@/lib/types";

const KINDS: DocKind[] = ["제안서", "견적서", "계약서", "회의록", "사양서", "보고서", "매뉴얼", "소개서", "기타"];

/** 지식 베이스의 "AI가 답장할 때 보는 순서"와 같은 말로 고른다 */
const USES: { value: DocLayer; title: string; desc: string }[] = [
  { value: "standard", title: "회사 기준", desc: "모든 답장에 먼저 적용" },
  { value: "company", title: "회사 자료", desc: "질문에 맞을 때 참고" },
  { value: "account", title: "고객사 공통 자료", desc: "그 회사 프로젝트 답장에만" },
  { value: "project", title: "프로젝트 자료", desc: "그 프로젝트 답장에만" },
];

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  /** 프로젝트 화면에서 열면 그 프로젝트 자료로 고정 */
  projectId?: string;
  /** 지식 베이스에서 회사를 보고 있으면 그 회사 공통 자료로 시작 */
  defaultAccountId?: string;
}

export function UploadDialog({ open, onClose, projectId, defaultAccountId }: UploadDialogProps) {
  const { projects, accounts, currentUser, role, addDoc, notify } = useDemo();
  const [fileName, setFileName] = useState<string | null>(null);
  const [use, setUse] = useState<DocLayer>(projectId ? "project" : defaultAccountId ? "account" : "company");
  const [category, setCategory] = useState<Exclude<KnowledgeCategory, "프로젝트" | "고객사">>("문서");
  const [selectedAccount, setSelectedAccount] = useState(defaultAccountId ?? accounts[0].id);
  const [kind, setKind] = useState<DocKind>("기타");
  const [selectedProject, setSelectedProject] = useState(projectId ?? projects[0].id);
  // 회사 기준은 모든 답장에 영향을 주니 팀장만 정한다
  const canSetStandard = role === "lead";

  const submit = () => {
    if (!fileName) return;
    const title = fileName.replace(/\.[^.]+$/, "");
    addDoc({
      title,
      category: use === "project" ? "프로젝트" : use === "account" ? "고객사" : category,
      kind,
      source: "upload",
      accountId: use === "account" ? selectedAccount : undefined,
      projectId: use === "project" ? selectedProject : undefined,
      updatedAt: DEMO_NOW.slice(0, 10),
      ownerId: currentUser.id,
      priority: use === "standard",
      usedCount: 0,
      summary: "업로드한 문서입니다. 분석이 끝나면 AI 요약이 여기에 표시됩니다.",
      highlights: [],
    });
    notify(`'${title}'을(를) 추가했어요. 이제 AI 답장의 근거로 쓰입니다.`);
    setFileName(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={projectId ? "문서 올리기" : "자료 올리기"}
      description="서비스에 올린 파일만 AI 답장에 자동 첨부할 수 있어요. 내 PC의 파일은 찾아보지 않습니다."
      footer={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={submit} disabled={!fileName}>
            추가
          </Button>
        </>
      }
    >
      <FileDrop fileName={fileName} onSelect={setFileName} />
      {!projectId && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-slate-700">AI가 이 자료를 언제 참고하나요?</p>
          <div className="grid grid-cols-2 gap-2">
            {USES.map((u) => {
              const locked = u.value === "standard" && !canSetStandard;
              return (
                <button
                  key={u.value}
                  type="button"
                  disabled={locked}
                  onClick={() => setUse(u.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50",
                    use === u.value ? "border-brand-400 bg-brand-50" : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <span className="block text-sm font-medium">{u.title}</span>
                  <span className="block text-xs text-slate-500">{u.desc}</span>
                </button>
              );
            })}
          </div>
          {!canSetStandard && <p className="text-xs text-slate-500">회사 기준은 팀장이 정해요. 팀장으로 보기에서 고를 수 있어요.</p>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {use === "project" ? (
          !projectId && (
            <Field label="프로젝트">
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className={inputClass}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          )
        ) : use === "account" ? (
          <Field label="회사">
            <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className={inputClass}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="분류">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Exclude<KnowledgeCategory, "프로젝트" | "고객사">)}
              className={inputClass}
            >
              <option value="문서">문서</option>
              <option value="영업">영업</option>
              <option value="회사 지식">회사 지식</option>
            </select>
          </Field>
        )}
        <Field label="종류">
          <select value={kind} onChange={(e) => setKind(e.target.value as DocKind)} className={inputClass}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  );
}
