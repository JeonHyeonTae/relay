"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { CHANNELS } from "@/lib/channels";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/demo-context";
import type { ChannelId } from "@/lib/types";

/** 안 A: 스페이스를 만들 때 어떤 소통 창구를 쓰는지 묻고 그 채널만 연결 (기능정리 1-8, 미결) */
export function NewProjectDialog({ open, onClose, accountId }: { open: boolean; onClose: () => void; accountId?: string }) {
  const { accounts, connected, addProject, notify, currentUser } = useDemo();
  const [selectedAccount, setSelectedAccount] = useState(accountId ?? accounts[0].id);
  const [name, setName] = useState("");
  const [channels, setChannels] = useState<ChannelId[]>(["email"]);

  const toggle = (id: ChannelId) =>
    setChannels((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const submit = () => {
    addProject({ accountId: selectedAccount, name: name.trim(), status: "진행 중", channels, memberIds: [currentUser.id] });
    notify(`'${name.trim()}' 스페이스를 만들었어요.`);
    setName("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="새 스페이스"
      tag="안 A"
      description="스페이스를 만들 때 소통 창구를 고르면, 그 채널로 오는 이 회사의 연락만 스페이스에 모입니다."
      footer={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={submit} disabled={!name.trim() || channels.length === 0}>
            만들기
          </Button>
        </>
      }
    >
      <Field label="고객사">
        <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className={inputClass}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="스페이스 이름">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 3공장 설비 증설" className={inputClass} />
      </Field>
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-slate-700">이 스페이스는 어떤 소통 창구를 쓰나요?</p>
        <div className="grid grid-cols-2 gap-2">
          {connected.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm",
                channels.includes(id) ? "border-brand-400 bg-brand-50 text-brand-700" : "border-slate-200 hover:bg-slate-50",
              )}
            >
              {CHANNELS[id].label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">연결된 채널만 보입니다. 다른 채널은 채널 연동 메뉴에서 먼저 연결하세요.</p>
      </div>
    </Modal>
  );
}
