"use client";

import { MessageSquareOff, Plus, Settings2, Upload } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CHANNELS, CONNECTABLE_CHANNELS, SEND_MODE_LABEL } from "@/lib/channels";
import { useDemo, visibleThreads } from "@/lib/demo-context";
import { findStaff } from "@/lib/mock-data";
import type { ChannelAccount, ChannelId } from "@/lib/types";
import { ConnectDialog } from "./connect-dialog";
import { KakaoFileDialog } from "./kakao-file-dialog";

const SEND_MODE_COLOR = {
  auto: "bg-emerald-50 text-emerald-700",
  draft: "bg-amber-50 text-amber-700",
  receive: "bg-slate-100 text-slate-500",
};

/**
 * 채널마다 계정을 여러 개 연결한다(메일 주소 여러 개, Slack 워크스페이스 여러 개 등).
 * 카드에는 내가 연결한 계정과 팀 공용 계정이 보인다 (기능정리 1-4)
 */
export function ChannelsView() {
  const { channelAccounts, threads, currentUser, role, sendModeOf } = useDemo();
  const [editing, setEditing] = useState<{ channel: ChannelId; account?: ChannelAccount } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const readable = visibleThreads(threads, currentUser, role);

  return (
    <div className="pb-10">
      <PageHeader
        title="채널 연동"
        description="API로 연결하면 각 메신저에 로그인하지 않아도 릴레이에서 바로 주고받을 수 있어요. 채널마다 계정을 여러 개 연결할 수 있어요."
      />

      <div className="grid gap-4 px-8 md:grid-cols-2 xl:grid-cols-3">
        {CONNECTABLE_CHANNELS.map((id) => {
          const channel = CHANNELS[id];
          // 내 계정이 먼저, 그다음 팀 공용 계정
          const accounts = channelAccounts
            .filter((a) => a.channel === id && (a.ownerId === currentUser.id || a.shared))
            .sort((a, b) => Number(Boolean(a.shared)) - Number(Boolean(b.shared)));
          const mode = sendModeOf(id);
          return (
            <div key={id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${channel.color}`}>
                  {channel.short.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{channel.label}</p>
                  <p className="truncate text-xs text-slate-500">{channel.note}</p>
                </div>
                <Badge className={SEND_MODE_COLOR[mode]}>{SEND_MODE_LABEL[mode]}</Badge>
              </div>

              {accounts.length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-400">연결한 계정이 없어요.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {accounts.map((a) => {
                    const count = readable.filter((t) => t.via === a.id).length;
                    const canEdit = a.ownerId === currentUser.id || role === "lead";
                    return (
                      <li key={a.id} className="flex items-center gap-2 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 text-sm font-medium">
                            <span className="truncate">{a.label}</span>
                            {a.shared && <Badge className="shrink-0 bg-brand-50 text-brand-700">팀 공용</Badge>}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {a.address}
                            {a.ownerId !== currentUser.id && ` · ${findStaff(a.ownerId).name} 연결`}
                            {count > 0 && ` · 대화 ${count}`}
                          </p>
                        </div>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setEditing({ channel: id, account: a })}
                            className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label={`${a.address} 설정`}
                            title="설정"
                          >
                            <Settings2 className="size-4" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-auto flex justify-end">
                <Button size="sm" variant={accounts.length ? "secondary" : "primary"} onClick={() => setEditing({ channel: id })}>
                  <Plus className="size-3.5" />
                  {accounts.length ? "계정 추가" : "연결하기"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mx-8 mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">연동이 안 되는 채널</h2>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white p-4">
          <MessageSquareOff className="size-6 text-slate-400" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">개인 카카오톡</p>
            <p className="text-xs text-slate-500">
              발송·대화 내역·친구 목록을 가져올 수 없어요. 대화 내보내기 파일을 올리면 그 회사 프로젝트의 대화 내역에 넣어 드려요.
            </p>
          </div>
          <Button onClick={() => setUploadingFile(true)}>
            <Upload className="size-4" />
            대화 파일 올리기
          </Button>
        </div>
      </div>

      {editing && (
        <ConnectDialog
          key={editing.account?.id ?? editing.channel}
          channel={editing.channel}
          account={editing.account}
          onClose={() => setEditing(null)}
        />
      )}
      <KakaoFileDialog open={uploadingFile} onClose={() => setUploadingFile(false)} />
    </div>
  );
}
