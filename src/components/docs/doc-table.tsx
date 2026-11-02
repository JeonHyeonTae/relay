"use client";

import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import { downloadNotice, isStale, sourceLabel } from "@/lib/docs";
import { formatDate } from "@/lib/format";
import { findStaff } from "@/lib/mock-data";
import type { KnowledgeDoc } from "@/lib/types";


interface DocTableProps {
  docs: KnowledgeDoc[];
  onOpen: (docId: string) => void;
  /** 지식 베이스처럼 여러 프로젝트 문서가 섞일 때 프로젝트 이름을 함께 보여준다 */
  showProject?: boolean;
}

export function DocTable({ docs, onOpen, showProject }: DocTableProps) {
  const { projects, notify, logActivity, team, role } = useDemo();
  // 팀 설정에서 원본 내려받기를 팀장만으로 막았으면 팀원은 못 받는다
  const canDownload = team.downloadScope === "all" || role === "lead";
  const [requested, setRequested] = useState<string[]>([]);

  if (docs.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">해당하는 문서가 없어요.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs whitespace-nowrap text-slate-500">
          <tr>
            <th className="px-4 py-2.5 font-medium">문서</th>
            <th className="px-4 py-2.5 font-medium">종류</th>
            <th className="hidden px-4 py-2.5 font-medium xl:table-cell">출처</th>
            <th className="px-4 py-2.5 font-medium">업데이트</th>
            <th className="px-4 py-2.5 text-right font-medium">답장 근거</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => {
            const stale = isStale(doc, team.staleMonths);
            const owner = findStaff(doc.ownerId);
            const project = projects.find((p) => p.id === doc.projectId);
            return (
              <tr
                key={doc.id}
                onClick={() => onOpen(doc.id)}
                className="group cursor-pointer border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="min-w-[14rem] px-4 py-3">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 size-4 shrink-0 text-slate-400" />
                    <div>
                      <span className="flex items-center gap-1">
                        <span className="font-medium group-hover:text-brand-600">{doc.title}</span>
                        {/* 이름 옆에서 바로 원본을 받아 AI가 쓴 내용이 맞는지 확인 */}
                        <button
                          type="button"
                          disabled={!canDownload}
                          onClick={(e) => {
                            e.stopPropagation();
                            notify(downloadNotice(doc));
                            logActivity(`'${doc.title}' 원본 내려받기`);
                          }}
                          className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`${doc.title} 원본 내려받기`}
                          title={canDownload ? "원본 내려받기" : "원본 내려받기는 팀장만 할 수 있어요"}
                        >
                          <Download className="size-3.5" />
                        </button>
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-slate-400">
                        {owner.name}
                        {showProject && project && ` · ${project.name}`}
                        <span className="xl:hidden">· {sourceLabel(doc.source)}</span>
                        {doc.priority && <Badge className="bg-brand-50 text-brand-700">회사 기준</Badge>}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-500">{doc.kind}</td>
                <td className="hidden px-4 py-3 text-xs text-slate-500 xl:table-cell">{sourceLabel(doc.source)}</td>
                <td
                  className={cn("px-4 py-3 whitespace-nowrap", stale ? "text-amber-700" : "text-slate-500")}
                  title={stale ? `${team.staleMonths}개월 넘게 바뀌지 않은 자료예요` : undefined}
                >
                  {formatDate(doc.updatedAt)}
                  {/* 예전 "업데이트 필요" 배지와 같은 주황으로, 눈에 띄는 배지 모양 버튼 */}
                  {stale && (
                    <button
                      type="button"
                      disabled={requested.includes(doc.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRequested((prev) => [...prev, doc.id]);
                        notify(`${owner.name}님에게 최신화를 요청했어요.`);
                      }}
                      className="ml-2 inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200 disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {requested.includes(doc.id) ? "요청함" : "최신화 요청"}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums text-slate-500">{doc.usedCount}회</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
