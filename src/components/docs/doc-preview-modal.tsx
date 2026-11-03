"use client";

import { Building2, Download, FileText, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useDemo } from "@/lib/demo-context";
import { downloadNotice, sourceLabel } from "@/lib/docs";
import { formatDate } from "@/lib/format";
import { findStaff } from "@/lib/mock-data";

export function DocPreviewModal({ docId, onClose }: { docId: string | null; onClose: () => void }) {
  const { docs, projects, accounts, role, setDocPriority, notify, logActivity, team } = useDemo();
  const canDownload = team.downloadScope === "all" || role === "lead";
  const doc = docs.find((d) => d.id === docId);
  if (!doc) return null;

  const project = projects.find((p) => p.id === doc.projectId);
  const account = accounts.find((a) => a.id === doc.accountId);

  return (
    <Modal
      open
      onClose={onClose}
      title={doc.title}
      footer={
        <>
          <Button
            disabled={!canDownload}
            title={canDownload ? undefined : "원본 내려받기는 팀장만 할 수 있어요"}
            onClick={() => {
              notify(downloadNotice(doc));
              logActivity(`'${doc.title}' 원본 내려받기`);
            }}
          >
            <Download className="size-4" />
            원본 내려받기
          </Button>
          <Button variant="primary" onClick={onClose}>
            닫기
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <Badge>{doc.kind}</Badge>
        {doc.priority && <Badge className="bg-brand-50 text-brand-700">회사 기준</Badge>}
        <span>{sourceLabel(doc.source)}</span>
        <span>·</span>
        <span>{formatDate(doc.updatedAt)}</span>
        <span>·</span>
        <span>{findStaff(doc.ownerId).name}</span>
        {project && (
          <>
            <span>·</span>
            <Link href={`/projects/${project.id}`} className="text-brand-600 hover:underline" onClick={onClose}>
              {project.name}
            </Link>
          </>
        )}
        {account && (
          <>
            <span>·</span>
            <Link href={`/knowledge?account=${account.id}`} className="text-brand-600 hover:underline" onClick={onClose}>
              {account.name} 공통 자료
            </Link>
          </>
        )}
      </div>

      <div className="space-y-2 rounded-xl bg-brand-50/60 p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
          <Sparkles className="size-3.5" />
          AI 요약
        </p>
        <p className="text-sm text-slate-700">{doc.summary}</p>
        <ul className="space-y-1 pt-1">
          {doc.highlights.map((h) => (
            <li key={h} className="text-sm text-slate-700">
              · {h}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex h-28 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
        <FileText className="size-5" />
        원본 파일 미리보기 영역 (데모)
        <span>AI 요약이 맞는지 원본을 내려받아 확인할 수 있어요</span>
      </div>

      <p className="text-xs text-slate-500">
        AI 답장의 근거로 <strong className="font-semibold text-slate-700">{doc.usedCount}회</strong> 쓰였어요.
      </p>

      {account && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
          <Building2 className="size-4 shrink-0 text-brand-600" />
          <p className="min-w-0 flex-1">
            <span className="font-medium">{account.name} 공통 자료예요</span>
            <span className="block text-xs text-slate-500">{account.name}의 모든 프로젝트 답장에 참고해요. 다른 회사 답장에는 쓰지 않아요.</span>
          </p>
        </div>
      )}

      {/* 회사 공통 자료만 회사 기준이 될 수 있다. 모든 답장에 영향을 주니 팀장만 바꾼다 */}
      {!doc.projectId && !doc.accountId && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
          <ShieldCheck className="size-4 shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">{doc.priority ? "회사 기준으로 쓰는 자료예요" : "회사 자료예요"}</p>
            <p className="text-xs text-slate-500">
              {doc.priority ? "모든 답장에 먼저 적용돼요." : "질문에 맞을 때만 참고해요. 회사 기준으로 바꾸면 모든 답장에 먼저 적용돼요."}
            </p>
          </div>
          {role === "lead" ? (
            <Button
              size="sm"
              onClick={() => {
                setDocPriority(doc.id, !doc.priority);
                logActivity(doc.priority ? `'${doc.title}'을 회사 기준에서 뺌` : `'${doc.title}'을 회사 기준으로 정함`);
                notify(doc.priority ? `'${doc.title}'을(를) 회사 기준에서 뺐어요.` : `'${doc.title}'을(를) 회사 기준으로 정했어요.`);
              }}
            >
              {doc.priority ? "회사 기준에서 빼기" : "회사 기준으로 쓰기"}
            </Button>
          ) : (
            <span className="text-xs text-slate-400">팀장만 바꿀 수 있어요</span>
          )}
        </div>
      )}
    </Modal>
  );
}
