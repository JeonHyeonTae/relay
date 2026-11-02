"use client";

import { Bell, Brain, Coins, History, KeyRound, PenLine, Plug, RefreshCw, ShieldCheck, Sparkles, UserPlus, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/common/page-header";
import { MondayDot } from "@/components/projects/monday";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inputClass } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { CHANNELS } from "@/lib/channels";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import { formatDateTime } from "@/lib/format";
import { CREDITS, MONDAY_ITEMS, MONDAY_SYNCED_AT, STAFF, findStaff } from "@/lib/mock-data";
import type { ChannelId, Staff } from "@/lib/types";
import { HandOverDialog } from "./hand-over-dialog";

type SettingsTab = "mine" | "team";

/** 자동 발송을 고를 수 있는 채널 (원래 자동 발송이 되는 채널) */
const AUTO_CAPABLE = (Object.keys(CHANNELS) as ChannelId[]).filter((id) => CHANNELS[id].sendMode === "auto");

/**
 * 설정: 내 설정(누구나 자기 것)과 팀 설정(팀장만 바꿈)으로 나눈다.
 * 담당자로 보면 팀 설정은 보기만 할 수 있다
 */
export function SettingsView() {
  const [tab, setTab] = useState<SettingsTab>("mine");

  return (
    <div className="pb-10">
      <PageHeader title="설정" description="내 설정은 누구나 바꾸고, 팀 설정은 팀장이 바꿔요." />
      <div className="mx-8 mb-4 flex gap-1 border-b border-slate-200">
        <TabButton active={tab === "mine"} onClick={() => setTab("mine")}>
          내 설정
        </TabButton>
        <TabButton active={tab === "team"} onClick={() => setTab("team")}>
          팀 설정
        </TabButton>
      </div>
      {tab === "mine" ? <MySettings /> : <TeamSettingsPanel />}
    </div>
  );
}

function MySettings() {
  const { currentUser, prefs, setPrefs } = useDemo();

  return (
    <div className="grid gap-5 px-8 lg:grid-cols-2">
      <Card title="내 정보" icon={<Users className="size-4 text-slate-500" />}>
        <div className="flex items-center gap-3">
          <Avatar name={currentUser.name} />
          <div>
            <p className="text-sm font-medium">{currentUser.name}</p>
            <p className="text-xs text-slate-500">
              {currentUser.title} · {currentUser.team}
            </p>
          </div>
        </div>
      </Card>

      <Card title="알림" icon={<Bell className="size-4 text-slate-500" />}>
        <div className="space-y-2.5">
          <SettingRow label="새 메시지" hint="내가 속한 채팅방에 메시지가 오면">
            <Switch label={<span className="sr-only">새 메시지 알림</span>} checked={prefs.notifyNewMessage} onChange={(on) => setPrefs({ notifyNewMessage: on })} />
          </SettingRow>
          <SettingRow label="답장 필요" hint="고객이 나에게 답을 기다리는 대화가 생기면">
            <Switch label={<span className="sr-only">답장 필요 알림</span>} checked={prefs.notifyReplyNeeded} onChange={(on) => setPrefs({ notifyReplyNeeded: on })} />
          </SettingRow>
          <SettingRow label="동료 답장" hint="물어본 동료가 1:1 채팅으로 답하면">
            <Switch label={<span className="sr-only">동료 답장 알림</span>} checked={prefs.notifyColleagueReply} onChange={(on) => setPrefs({ notifyColleagueReply: on })} />
          </SettingRow>
        </div>
      </Card>

      <Card title="답장 서명" icon={<PenLine className="size-4 text-slate-500" />}>
        <textarea
          value={prefs.signature}
          onChange={(e) => setPrefs({ signature: e.target.value })}
          rows={3}
          placeholder={`예: ${currentUser.name} 드림\n${currentUser.team} · 010-0000-0000`}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <p className="mt-1.5 text-xs text-slate-500">수신함에서 보낼 때 답장 끝에 붙어요. 비워 두면 붙지 않아요.</p>
      </Card>

      <Card title="AI 답장" icon={<Sparkles className="size-4 text-brand-600" />}>
        <SettingRow label="새 채팅방에서 AI 답장 켜기" hint="새로 만드는 채팅방(동료와의 1:1 포함)의 기본값이에요. 채팅방마다 대화창 위쪽에서 바꿀 수 있어요.">
          <Switch label={<span className="sr-only">새 채팅방 AI 답장</span>} checked={prefs.aiReplyDefault} onChange={(on) => setPrefs({ aiReplyDefault: on })} />
        </SettingRow>
      </Card>
    </div>
  );
}

function TeamSettingsPanel() {
  const { role, team, setTeam, projects, learnedEdits, activity, notify, logActivity } = useDemo();
  const [handingOver, setHandingOver] = useState<Staff | null>(null);
  const [staffRoles, setStaffRoles] = useState<Record<string, "member" | "lead">>({ s2: "lead" });
  const isLead = role === "lead";
  const activeOf = (staffId: string) => projects.filter((p) => p.memberIds.includes(staffId) && p.status !== "완료");
  // 팀 설정을 바꿀 때마다 활동 기록에 남긴다
  const change = (patch: Parameters<typeof setTeam>[0], text: string) => {
    setTeam(patch);
    logActivity(text);
  };

  const permissions = [
    { target: "본인에게 온 연락 보기", member: true },
    { target: "팀원 개인에게 온 연락 보기", member: false },
    { target: "팀 공유 채널의 연락 보기", member: true },
    { target: "자료 원본 내려받기", member: team.downloadScope === "all" },
    { target: "회사 기준 정하기", member: false },
    { target: "팀 설정 바꾸기·프로젝트 넘기기", member: false },
  ];

  return (
    <>
      {!isLead && (
        <p className="mx-8 mb-4 rounded-lg bg-slate-100 px-4 py-2.5 text-sm text-slate-600">
          팀 설정은 팀장만 바꿀 수 있어요. 지금은 보기만 할 수 있어요. 위쪽 &ldquo;팀장으로 보기&rdquo;로 바꿔 보세요.
        </p>
      )}
      <fieldset disabled={!isLead} className="grid gap-5 px-8 lg:grid-cols-2">
        <Card
          title="팀원"
          icon={<Users className="size-4 text-slate-500" />}
          action={
            <Button size="sm" variant="ghost" onClick={() => notify("데모에서는 초대 메일 대신 알림만 보여요.")}>
              <UserPlus className="size-3.5" />
              초대
            </Button>
          }
        >
          <ul className="space-y-3">
            {STAFF.map((s) => {
              const active = activeOf(s.id);
              return (
                <li key={s.id} className="flex items-center gap-3">
                  <Avatar name={s.name} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                      {s.name}
                      {s.note && <Badge className="bg-amber-100 text-amber-800">{s.note}</Badge>}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.title} · {s.team} · 참여 중인 프로젝트 {active.length}개
                    </p>
                  </div>
                  <select
                    value={staffRoles[s.id] ?? "member"}
                    onChange={(e) => {
                      setStaffRoles((prev) => ({ ...prev, [s.id]: e.target.value as "member" | "lead" }));
                      logActivity(`${s.name}님 역할을 ${e.target.value === "lead" ? "팀장" : "담당자"}로 바꿈`);
                    }}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs disabled:bg-slate-50"
                    aria-label={`${s.name} 역할`}
                  >
                    <option value="member">담당자</option>
                    <option value="lead">팀장</option>
                  </select>
                  {active.length > 0 && isLead && (
                    <Button size="sm" onClick={() => setHandingOver(s)}>
                      넘기기
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            &ldquo;넘기기&rdquo;는 퇴사·이동하는 사람의 진행 중 프로젝트를 한 번에 다른 사람에게 넘겨요.
          </p>
        </Card>

        <Card title="권한" icon={<KeyRound className="size-4 text-slate-500" />}>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="pb-2 font-medium">무엇을</th>
                <th className="pb-2 font-medium">담당자</th>
                <th className="pb-2 font-medium">팀장</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.target} className="border-t border-slate-100">
                  <td className="py-2.5 pr-2">{p.target}</td>
                  <td className="py-2.5">{p.member ? "가능" : <span className="text-slate-300">불가</span>}</td>
                  <td className="py-2.5">가능</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">&ldquo;자료 원본 내려받기&rdquo;는 아래 보안에서 바꿀 수 있어요.</p>
        </Card>

        <Card title="AI 기준" icon={<Sparkles className="size-4 text-brand-600" />} className="lg:col-span-2">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium">자동 발송을 허용할 채널</p>
              <p className="mb-2 text-xs text-slate-500">끄면 그 채널은 초안만 만들고, 복사해서 보내요.</p>
              <div className="space-y-1.5">
                {AUTO_CAPABLE.map((id) => (
                  <label key={id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={team.autoSendChannels.includes(id)}
                      onChange={(e) =>
                        change(
                          {
                            autoSendChannels: e.target.checked
                              ? [...team.autoSendChannels, id]
                              : team.autoSendChannels.filter((c) => c !== id),
                          },
                          `${CHANNELS[id].label} 자동 발송 ${e.target.checked ? "허용" : "끔"}`,
                        )
                      }
                    />
                    {CHANNELS[id].label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="catch-up-min" className="text-sm font-medium">
                안 읽은 내용 요약
              </label>
              <p className="mb-2 text-xs text-slate-500">안 읽은 메시지가 몇 개 쌓이면 요약 버튼을 띄울까요?</p>
              <select
                id="catch-up-min"
                value={team.catchUpMin}
                onChange={(e) => change({ catchUpMin: Number(e.target.value) }, `안 읽은 요약 기준을 ${e.target.value}개로 바꿈`)}
                className={inputClass}
              >
                {[3, 5, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}개 이상
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="stale-months" className="text-sm font-medium">
                자료 최신화 기준
              </label>
              <p className="mb-2 text-xs text-slate-500">이만큼 바뀌지 않은 자료에 &ldquo;최신화 요청&rdquo;이 붙어요.</p>
              <select
                id="stale-months"
                value={team.staleMonths}
                onChange={(e) => change({ staleMonths: Number(e.target.value) }, `자료 최신화 기준을 ${e.target.value}개월로 바꿈`)}
                className={inputClass}
              >
                {[3, 6, 12].map((n) => (
                  <option key={n} value={n}>
                    {n}개월
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">AI가 찾아볼 대화 기간은 지식 베이스의 &ldquo;④ 대화 내역&rdquo;에서 정해요.</p>
        </Card>

        <Card title="업무 도구 연동" icon={<Plug className="size-4 text-slate-500" />}>
          <div className="flex flex-wrap items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
              <MondayDot />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                먼데이
                {team.mondayConnected ? (
                  <Badge className="bg-emerald-50 text-emerald-700">연결됨</Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-500">연결 안 됨</Badge>
                )}
              </p>
              <p className="text-xs text-slate-500">
                {team.mondayConnected
                  ? `프로젝트 ${MONDAY_ITEMS.length}개와 연결 · ${formatDateTime(MONDAY_SYNCED_AT)} 동기화`
                  : "연결하면 진행 단계·마감·업무를 프로젝트에서 함께 봐요"}
              </p>
            </div>
            {team.mondayConnected && (
              <Button size="sm" onClick={() => notify("데모에서는 동기화 대신 알림만 보여요.")}>
                <RefreshCw className="size-3.5" />
                지금 동기화
              </Button>
            )}
          </div>
          {team.mondayConnected && (
            <div className="mt-3">
              <label htmlFor="monday-board" className="text-xs text-slate-500">
                받아올 보드
              </label>
              <select
                id="monday-board"
                value={team.mondayBoard}
                onChange={(e) => change({ mondayBoard: e.target.value }, `먼데이 보드를 '${e.target.value}'로 바꿈`)}
                className={cn(inputClass, "mt-1")}
              >
                {["영업1팀 프로젝트", "기술지원 일정", "전사 영업 파이프라인"].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>프로젝트 하나 = 먼데이 아이템 하나. 고칠 때는 먼데이에서 바꿔요.</span>
            <button
              type="button"
              onClick={() => {
                change({ mondayConnected: !team.mondayConnected }, team.mondayConnected ? "먼데이 연결 해제" : "먼데이 연결");
                notify(team.mondayConnected ? "먼데이 연결을 끊었어요. (데모에서는 프로젝트 화면은 그대로예요)" : "먼데이를 연결했어요.");
              }}
              className={cn("shrink-0 hover:underline", team.mondayConnected ? "text-rose-600" : "text-brand-600")}
            >
              {team.mondayConnected ? "연결 해제" : "연결하기"}
            </button>
          </div>
        </Card>

        <Card title="보안" icon={<ShieldCheck className="size-4 text-slate-500" />}>
          <div className="space-y-3">
            <div>
              <label htmlFor="download-scope" className="text-sm font-medium">
                자료 원본 내려받기
              </label>
              <select
                id="download-scope"
                value={team.downloadScope}
                onChange={(e) =>
                  change(
                    { downloadScope: e.target.value as "all" | "lead" },
                    `자료 원본 내려받기를 ${e.target.value === "all" ? "모두 허용" : "팀장만"}으로 바꿈`,
                  )
                }
                className={cn(inputClass, "mt-1")}
              >
                <option value="all">팀원 모두</option>
                <option value="lead">팀장만</option>
              </select>
            </div>
            <InfoRow title="부서 단위 워크스페이스" body="영업1팀 워크스페이스 · 다른 부서와 데이터가 섞이지 않습니다." />
            <InfoRow title="파일 첨부 범위" body="서비스 안 클라우드에 올린 파일만 첨부합니다. 사용자 PC 파일은 찾아보지 않습니다." />
            <InfoRow title="AI 답변 범위" body="지식 베이스의 자료와 대화 내역 안에서만 답합니다." />
          </div>
        </Card>

        <Card title="활동 기록" icon={<History className="size-4 text-slate-500" />} className="lg:col-span-2">
          <p className="mb-3 text-xs text-slate-500">
            개인 연락 열람, 원본 내려받기, 발송, 설정 변경이 남아요. 고객사 정보보안팀 검토에 그대로 쓸 수 있어요.
          </p>
          <ul className="divide-y divide-slate-100 text-sm">
            {activity.slice(0, 10).map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2">
                <span className="w-28 shrink-0 text-xs text-slate-400">{formatDateTime(a.at)}</span>
                <span className="w-14 shrink-0 text-xs font-medium text-slate-600">{findStaff(a.staffId).name}</span>
                <span className="min-w-0 flex-1 truncate">{a.text}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="요금 · 크레딧" icon={<Coins className="size-4 text-slate-500" />}>
          <div className="space-y-4">
            <p className="text-sm">
              인당 ${CREDITS.pricePerSeat} × {CREDITS.seats}명 ={" "}
              <strong className="font-semibold">${CREDITS.pricePerSeat * CREDITS.seats}/월</strong>
            </p>
            <CreditBar label="팀 크레딧" used={CREDITS.team.used} total={CREDITS.team.total} />
            <CreditBar label="내 크레딧" used={CREDITS.personal.used} total={CREDITS.personal.total} />
            <ul className="space-y-1.5 border-t border-slate-100 pt-3 text-sm">
              {CREDITS.usage.map((u) => (
                <li key={u.label} className="flex justify-between">
                  <span className="text-slate-600">{u.label}</span>
                  <span className="tabular-nums">{u.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <Button size="sm" onClick={() => notify("데모에서는 결제 대신 알림만 보여요.")}>
              크레딧 충전
            </Button>
          </div>
        </Card>

        <Card title="답장 학습" icon={<Brain className="size-4 text-slate-500" />}>
          <p className="text-sm text-slate-700">
            사람이 고친 뒤 보낸 AI 초안 <strong className="font-semibold">{learnedEdits}건</strong>이 학습 대기 중이에요.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            고친 내역을 모아 한 번에 반영합니다. 처음에는 승인 후 발송으로 시작하고, 학습이 쌓이면 자동 발송을 넓힙니다.
          </p>
        </Card>
      </fieldset>

      {handingOver && <HandOverDialog staff={handingOver} onClose={() => setHandingOver(null)} />}
    </>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 px-3 py-2 text-sm",
        active ? "border-brand-600 font-medium text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700",
      )}
    >
      {children}
    </button>
  );
}

function CreditBar({ label, used, total }: { label: string; used: number; total: number }) {
  const percent = Math.round((used / total) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="tabular-nums text-slate-500">
          {used.toLocaleString()} / {total.toLocaleString()}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-brand-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
