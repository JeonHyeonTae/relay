"use client";

import { Copy, FileText, Mail, Mic, Plus, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useDemo } from "@/lib/demo-context";
import { formatDateTime } from "@/lib/format";
import { MEETINGS, findStaff } from "@/lib/mock-data";
import type { Meeting } from "@/lib/types";
import { DueLabel } from "./monday";

/**
 * 프로젝트 회의: 회의록을 올리거나 노트테이커(2차 서비스) 녹음이 들어오면 AI가 요약·정한 것·할 일을 뽑고
 * 후속 메일 초안까지 만든다. 할 일은 먼데이 업무로 보낼 수 있다
 */
export function MeetingsTab({ projectId, onOpenDoc }: { projectId: string; onOpenDoc: (docId: string) => void }) {
  const { notify } = useDemo();
  const [followUp, setFollowUp] = useState<Meeting | null>(null);
  const meetings = MEETINGS.filter((m) => m.projectId === projectId).sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-slate-500">회의록을 올리거나 녹음을 연결하면 AI가 요약하고, 정한 것과 할 일, 후속 메일 초안을 만들어요.</p>
        <Button
          size="sm"
          className="ml-auto"
          onClick={() => notify("데모에서는 알림만 보여요. 실제로는 회의록 파일을 올리거나 노트테이커 녹음을 연결해요.")}
        >
          <Plus className="size-3.5" />
          회의 연결
        </Button>
      </div>

      {meetings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
          아직 연결된 회의가 없어요.
        </p>
      ) : (
        meetings.map((m) => (
          <Card
            key={m.id}
            title={m.title}
            icon={m.source === "녹음" ? <Mic className="size-4 text-rose-500" /> : <FileText className="size-4 text-slate-500" />}
            action={<span className="text-xs text-slate-400">{formatDateTime(m.at)}</span>}
          >
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <Badge>{m.source === "녹음" ? "녹음 · 노트테이커" : "회의록 업로드"}</Badge>
                참석 {m.attendees.length}명 · {m.attendees.join(", ")}
                {m.docId && (
                  <button type="button" onClick={() => onOpenDoc(m.docId!)} className="text-brand-600 hover:underline">
                    회의록 보기
                  </button>
                )}
              </div>

              <p className="leading-relaxed text-slate-700">
                <Sparkles className="mr-1 inline size-3.5 text-brand-600" />
                {m.summary}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-500">정한 것</p>
                  <ul className="space-y-1">
                    {m.decisions.map((d) => (
                      <li key={d}>· {d}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-500">할 일</p>
                  <ul className="space-y-1.5">
                    {m.actions.map((a) => (
                      <li key={a.text} className="flex flex-wrap items-center gap-x-2">
                        <span>· {a.text}</span>
                        <span className="text-xs text-slate-500">
                          {a.ownerId && findStaff(a.ownerId).name}
                          {a.due && (
                            <>
                              {" "}
                              <DueLabel iso={a.due} className="text-xs" />
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => notify("데모에서는 알림만 보여요. 실제로는 할 일이 먼데이 하위 업무로 추가돼요.")}
                    className="mt-1.5 text-xs text-brand-600 hover:underline"
                  >
                    먼데이 업무로 보내기
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                {m.followUpThreadId ? (
                  <>
                    <Badge className="bg-emerald-50 text-emerald-700">후속 메일 보냄</Badge>
                    <Link href={`/inbox?thread=${m.followUpThreadId}`} className="text-xs text-brand-600 hover:underline">
                      보낸 메일 보기
                    </Link>
                  </>
                ) : (
                  <Button size="sm" variant="primary" onClick={() => setFollowUp(m)}>
                    <Mail className="size-3.5" />
                    후속 메일 초안 보기
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))
      )}

      {followUp && <FollowUpDialog meeting={followUp} onClose={() => setFollowUp(null)} />}
    </div>
  );
}

function FollowUpDialog({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  const { notify, logActivity } = useDemo();
  const [text, setText] = useState(meeting.followUp);

  return (
    <Modal
      open
      onClose={onClose}
      title={`${meeting.title} 후속 메일`}
      description="회의에서 정한 것과 할 일로 AI가 쓴 초안이에요. 고친 뒤 보내세요."
      footer={
        <>
          <Button
            onClick={async () => {
              await navigator.clipboard?.writeText(text);
              notify("복사했어요.");
            }}
          >
            <Copy className="size-4" />
            복사
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              notify("후속 메일을 보냈어요. 이 프로젝트 메일 대화에 기록돼요.");
              logActivity(`'${meeting.title}' 후속 메일 발송`);
              onClose();
            }}
          >
            <Send className="size-4" />
            보내기
          </Button>
        </>
      }
    >
      <p className="text-xs text-slate-500">받는 사람: {meeting.attendees.filter((a) => /대리|과장|팀장|책임|차장|선임|부장|매니저/.test(a)).join(", ")}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </Modal>
  );
}
