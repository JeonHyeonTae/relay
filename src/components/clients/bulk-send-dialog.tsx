"use client";

import { Mail, Sparkles, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { DueLabel, mondayOf, nextDue } from "@/components/projects/monday";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { SCENARIOS, scenarioOf, scenarioTargets, type ScenarioKey } from "@/lib/bulk-mail";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import type { Account, Project } from "@/lib/types";

interface Draft {
  account: Account;
  /** 받는 사람: 메일 주소가 있는 첫 연락처 */
  to?: { name: string; email: string };
  project?: Project;
  subject: string;
  body: string;
  include: boolean;
}

/**
 * 여러 고객사에 한 번에 보내기: 상황(공지·정기 일정·계약 갱신)을 고르면 대상과 문구가 채워지고,
 * 회사마다 이름·프로젝트·맞춤 한 줄을 넣어 하나씩 확인한 뒤 보낸다
 */
export function BulkSendDialog({ initialScenario = "notice", onClose }: { initialScenario?: ScenarioKey; onClose: () => void }) {
  const { accounts, projects, notify, logActivity } = useDemo();
  const [step, setStep] = useState<"write" | "review">("write");
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>(initialScenario);
  const [targets, setTargets] = useState<string[]>(() => scenarioTargets(initialScenario, accounts, projects));
  const [subject, setSubject] = useState(scenarioOf(initialScenario).subject);
  const [body, setBody] = useState(scenarioOf(initialScenario).body);
  const [personalize, setPersonalize] = useState(true);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const scenario = scenarioOf(scenarioKey);

  // 상황을 바꾸면 대상과 문구를 그 상황에 맞게 다시 채운다
  const pickScenario = (key: ScenarioKey) => {
    const next = scenarioOf(key);
    setScenarioKey(key);
    setTargets(scenarioTargets(key, accounts, projects));
    setSubject(next.subject);
    setBody(next.body);
  };

  const toggleTarget = (id: string) => setTargets((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const fill = (text: string, account: Account, project: Project | undefined, name: string) =>
    text.replaceAll("{회사}", account.name).replaceAll("{이름}", name).replaceAll("{프로젝트}", project?.name ?? "진행 중인 일");

  const makeDrafts = () => {
    setDrafts(
      accounts
        .filter((a) => targets.includes(a.id))
        .map((account) => {
          const contact = account.contacts.find((c) => c.email);
          const name = contact ? `${contact.name} ${contact.title}` : account.name;
          const project = scenario.match(projects.filter((p) => p.accountId === account.id));
          let text = fill(body, account, project, name);
          const line = personalize && project ? scenario.personalLine(project, mondayOf(project.id)) : null;
          if (line) text = text.includes("\n감사합니다.") ? text.replace("\n감사합니다.", `\n${line}\n감사합니다.`) : `${text}\n${line}`;
          return {
            account,
            to: contact?.email ? { name, email: contact.email } : undefined,
            project,
            subject: fill(subject, account, project, name),
            body: text,
            include: Boolean(contact?.email),
          };
        }),
    );
    setStep("review");
  };

  const update = (accountId: string, patch: Partial<Draft>) =>
    setDrafts((prev) => prev.map((d) => (d.account.id === accountId ? { ...d, ...patch } : d)));

  const sending = drafts.filter((d) => d.include && d.to);

  const send = () => {
    notify(`${sending.length}곳에 메일을 보냈어요. 각 고객사 대화에 기록돼요.`);
    logActivity(`고객사 ${sending.length}곳에 ${scenario.title} 메일 "${subject}" 발송`);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="여러 고객사에 메일 보내기"
      description={
        step === "write"
          ? "상황을 고르면 받을 고객사와 문구가 채워져요. 회사마다 이름과 진행 중인 일을 넣어 맞춰 쓰고, 보내기 전에 하나씩 확인해요."
          : "회사마다 맞춰 쓴 메일이에요. 고칠 곳은 고치고, 보내지 않을 곳은 체크를 빼세요. 보낸 메일은 고객사마다 대화 기록에 남아요."
      }
      footer={
        step === "write" ? (
          <>
            <Button onClick={onClose}>취소</Button>
            <Button variant="primary" onClick={makeDrafts} disabled={!targets.length || !subject.trim() || !body.trim()}>
              <Sparkles className="size-4" />
              {targets.length}곳 맞춰 보기
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setStep("write")}>다시 쓰기</Button>
            <Button variant="primary" onClick={send} disabled={sending.length === 0}>
              <Mail className="size-4" />
              {sending.length}곳에 보내기
            </Button>
          </>
        )
      }
    >
      {step === "write" ? (
        <>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-slate-700">어떤 일로 보내나요?</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SCENARIOS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => pickScenario(s.key)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm",
                    scenarioKey === s.key ? "border-brand-400 bg-brand-50 font-medium" : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-slate-700">
              받을 고객사 {targets.length}곳
              <span className="ml-2 text-xs font-normal text-slate-500">
                {scenarioKey === "custom" ? "직접 골라 주세요" : `자동으로 고름: ${scenario.rule}`}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-slate-50 p-3 sm:grid-cols-3">
              {accounts.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4" checked={targets.includes(a.id)} onChange={() => toggleTarget(a.id)} />
                  {a.name}
                </label>
              ))}
            </div>
          </div>

          <Field label="제목">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
          </Field>
          <Field label="내용" hint="{회사}, {이름}, {프로젝트}는 회사마다 알맞은 값으로 바뀌어요.">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={personalize} onChange={(e) => setPersonalize(e.target.checked)} className="mt-0.5 size-4" />
            <span>
              AI가 회사마다 한 줄 덧붙이기
              <span className="block text-xs text-slate-500">
                {scenarioKey === "notice" && "진행 중인 견적은 기존 단가로 유지된다는 안내를 회사마다 넣어요."}
                {scenarioKey === "maintenance" && "먼데이에서 진행 중인 점검 업무를 회사마다 넣어요."}
                {scenarioKey === "renewal" && "현재 계약 금액을 회사마다 넣어요."}
                {scenarioKey === "custom" && "진행 중인 프로젝트를 회사마다 넣어요."}
              </span>
            </span>
          </label>
        </>
      ) : (
        <ul className="space-y-3">
          {drafts.map((d) => (
            <li
              key={d.account.id}
              className={cn("rounded-xl border p-3", d.include ? "border-slate-200" : "border-dashed border-slate-200 opacity-60")}
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="checkbox"
                  checked={d.include}
                  disabled={!d.to}
                  onChange={(e) => update(d.account.id, { include: e.target.checked })}
                  className="size-4"
                  aria-label={`${d.account.name}에 보내기`}
                />
                <span className="text-sm font-medium">{d.account.name}</span>
                {d.to ? (
                  <span className="text-xs text-slate-500">
                    {d.to.name} · {d.to.email}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                    <TriangleAlert className="size-3.5" />
                    메일 주소가 없어요. 프로젝트 화면의 고객사 연락처에서 추가해 주세요.
                  </span>
                )}
                {d.project && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-slate-400">
                    {d.project.name}
                    {(() => {
                      const monday = mondayOf(d.project.id);
                      const due = monday && nextDue(monday);
                      return due ? <DueLabel iso={due} className="text-xs" /> : null;
                    })()}
                  </span>
                )}
              </div>
              {d.to && (
                <>
                  <p className="mt-2 text-sm font-medium text-slate-700">{d.subject}</p>
                  <textarea
                    value={d.body}
                    onChange={(e) => update(d.account.id, { body: e.target.value })}
                    rows={5}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
