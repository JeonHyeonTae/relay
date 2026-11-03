"use client";

import { ArrowLeft, Building2, ChevronRight, Contact, FileText, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BackToConversation } from "@/components/common/back-to-conversation";
import { ChannelBadge } from "@/components/common/channel-badge";
import { ProjectStatusBadge } from "@/components/common/project-status-badge";
import { DocPreviewModal } from "@/components/docs/doc-preview-modal";
import { DueLabel, StageBadge, mondayOf, nextDue } from "@/components/projects/monday";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDemo } from "@/lib/demo-context";
import { findStaff } from "@/lib/mock-data";
import type { Project } from "@/lib/types";

const STATUS_ORDER: Record<Project["status"], number> = { "진행 중": 0, 대기: 1, 완료: 2 };

/** 고객사 한 곳과 진행한 스페이스들. 사람·문서·대화는 각 스페이스에서 관리한다 */
export function ClientDetail({ id }: { id: string }) {
  const { accounts, projects, docs } = useDemo();
  const [creating, setCreating] = useState(false);
  const [openDocId, setOpenDocId] = useState<string | null>(null);

  const account = accounts.find((a) => a.id === id);
  if (!account) {
    return <p className="p-8 text-sm text-slate-500">고객사를 찾을 수 없어요.</p>;
  }

  // 이 회사 모든 스페이스 답장에 참고하는 자료
  const commonDocs = docs.filter((d) => d.accountId === id);
  // 진행 중인 스페이스가 위로
  const accountProjects = projects
    .filter((p) => p.accountId === id)
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  return (
    <div className="space-y-5 px-8 py-6">
      <BackToConversation />
      <Link href="/clients" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
        <ArrowLeft className="size-3.5" />
        고객사
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{account.name}</h1>
        <Badge>{account.industry}</Badge>
        <Button variant="primary" className="ml-auto" onClick={() => setCreating(true)}>
          <Plus className="size-4" />새 스페이스
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="space-y-3 lg:col-span-2">
          <h2 className="text-sm font-semibold">스페이스 {accountProjects.length}</h2>
          <ul className="space-y-3">
            {accountProjects.map((project) => {
              const monday = mondayOf(project.id);
              const due = monday && nextDue(monday);
              return (
                <li key={project.id}>
                  <Link
                    href={`/spaces/${project.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-300 hover:bg-brand-50/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{project.name}</span>
                      <ProjectStatusBadge status={project.status} />
                      {monday && <StageBadge stage={monday.stage} />}
                      <ChevronRight className="ml-auto size-4 text-slate-400" />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                      <span className="flex flex-wrap gap-1">
                        {project.channels.map((c) => (
                          <ChannelBadge key={c} channel={c} />
                        ))}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" />
                        {project.memberIds.map((m) => findStaff(m).name).join(", ")}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="size-3.5" />
                        문서 {docs.filter((d) => d.projectId === project.id).length}
                      </span>
                      {due && (
                        <span className="flex items-center gap-1">
                          다음 마감 <DueLabel iso={due} className="text-xs" />
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-5">
          <Card title="연락처" icon={<Contact className="size-4 text-slate-500" />}>
            <ul className="space-y-3">
              {account.contacts.map((c) => (
                <li key={c.name}>
                  <p className="text-sm font-medium">
                    {c.name} {c.title}
                  </p>
                  <p className="text-xs text-slate-500">{c.role}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card
            title={`공통 자료 ${commonDocs.length}`}
            icon={<Building2 className="size-4 text-slate-500" />}
            action={
              <Link href={`/knowledge?account=${id}`} className="text-xs font-normal text-brand-600 hover:underline">
                지식 베이스에서 관리
              </Link>
            }
          >
            <p className="mb-3 text-xs text-slate-500">이 회사 모든 스페이스 답장에 참고하는 자료예요.</p>
            {commonDocs.length > 0 && (
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
            )}
          </Card>
        </div>
      </div>

      <NewProjectDialog key={id} open={creating} onClose={() => setCreating(false)} accountId={id} />
      <DocPreviewModal docId={openDocId} onClose={() => setOpenDocId(null)} />
    </div>
  );
}
