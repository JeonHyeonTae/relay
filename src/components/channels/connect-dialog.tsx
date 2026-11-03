"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { CHANNELS } from "@/lib/channels";
import { useDemo } from "@/lib/demo-context";
import type { ChannelAccount, ChannelId } from "@/lib/types";

interface ConnectDialogProps {
  channel: ChannelId;
  /** 이미 연결한 계정의 설정. 없으면 새 계정을 연결한다 */
  account?: ChannelAccount;
  onClose: () => void;
}

/**
 * 계정별 권한 키를 입력해 연결 (기능정리 1-4). 한 채널에 계정을 여러 개 연결할 수 있다.
 * 안 B: 채널을 연동할 때 스페이스를 지정 (기능정리 1-8, 미결)
 */
export function ConnectDialog({ channel, account, onClose }: ConnectDialogProps) {
  const { channelAccounts, projects, role, addChannelAccount, updateChannelAccount, removeChannelAccount, notify, logActivity } =
    useDemo();
  const meta = CHANNELS[channel];
  const [address, setAddress] = useState(account?.address ?? "");
  const [label, setLabel] = useState(account?.label ?? "");
  const [key, setKey] = useState(account ? "••••••••••••••••" : "");
  const [shared, setShared] = useState(account?.shared ?? false);
  const [projectId, setProjectId] = useState("auto");
  const isLead = role === "lead";
  // 같은 채널에 같은 계정을 두 번 연결하지 않는다
  const duplicate =
    !account &&
    channelAccounts.some((a) => a.channel === channel && a.address.trim().toLowerCase() === address.trim().toLowerCase());

  const save = () => {
    if (account) {
      updateChannelAccount(account.id, { label: label.trim() || account.label, shared });
      notify("계정 설정을 저장했어요.");
    } else {
      addChannelAccount({ channel, address: address.trim(), label: label.trim() || meta.label, shared });
      notify(`${meta.label} 계정 ${address.trim()}을(를) 연결했어요.`);
      logActivity(`${meta.label} 계정 ${address.trim()} 연결`);
    }
    onClose();
  };

  const disconnect = () => {
    if (!account) return;
    removeChannelAccount(account.id);
    notify(`${account.address} 연결을 해제했어요.`);
    logActivity(`${meta.label} 계정 ${account.address} 연결 해제`);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={account ? `${meta.label} 계정 설정` : `${meta.label} 계정 연결`}
      description={account ? account.address : `${meta.note}. 이미 연결한 계정이 있어도 더 연결할 수 있어요.`}
      footer={
        <>
          {account && (
            <Button variant="ghost" className="mr-auto text-rose-600" onClick={disconnect}>
              연결 해제
            </Button>
          )}
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={save} disabled={!address.trim() || !key.trim() || duplicate}>
            {account ? "저장" : "연결"}
          </Button>
        </>
      }
    >
      {!account && (
        <ol className="space-y-1.5 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          <li>1. {meta.label} 관리 화면에서 연결할 계정의 API 권한 키를 발급합니다.</li>
          <li>2. 계정과 발급한 키를 아래에 넣습니다.</li>
          <li>3. 연결하면 연결 테스트 후 그 계정의 대화를 불러옵니다.</li>
        </ol>
      )}
      <Field
        label={meta.account.label}
        hint={duplicate ? "이미 연결한 계정이에요." : account ? "계정을 바꾸려면 연결을 해제하고 새로 연결해 주세요." : undefined}
      >
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={Boolean(account)}
          placeholder={`예: ${meta.account.example}`}
          className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}
        />
      </Field>
      <Field label="구분 이름" hint="수신함에서 어느 계정으로 온 연락인지 구분할 때 보여요.">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="예: 내 메일, 영업팀 공용 메일" className={inputClass} />
      </Field>
      <Field label="권한 키">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="발급받은 키를 붙여 넣으세요"
          className={inputClass}
        />
      </Field>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={shared}
          onChange={(e) => setShared(e.target.checked)}
          disabled={!isLead}
          className="mt-0.5 size-4"
        />
        <span>
          팀 공용 계정으로 쓰기
          <span className="block text-xs text-slate-500">
            영업팀 공용 메일, 카카오톡 채널처럼 팀원 모두가 이 계정으로 온 연락을 받아요.
            {!isLead && " 팀장만 정할 수 있어요."}
          </span>
        </span>
      </label>
      {!account && (
        <Field label="이 계정으로 들어오는 연락을 연결할 스페이스" hint="안 B: 채널을 연동할 때 스페이스를 지정하는 방식">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass}>
            <option value="auto">AI가 자동으로 분류</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      )}
    </Modal>
  );
}
