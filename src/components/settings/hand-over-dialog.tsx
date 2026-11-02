"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useDemo } from "@/lib/demo-context";
import { STAFF, findStaff } from "@/lib/mock-data";
import type { Staff } from "@/lib/types";

/** 퇴사·이동하는 사람이 참여 중인 프로젝트를 한 번에 다른 사람에게 넘긴다 (기능정리 3-3) */
export function HandOverDialog({ staff, onClose }: { staff: Staff; onClose: () => void }) {
  const { projects, replaceMember, notify, logActivity } = useDemo();
  // 끝난 프로젝트는 기록으로 남기고, 진행 중·대기인 것만 넘긴다
  const active = projects.filter((p) => p.memberIds.includes(staff.id) && p.status !== "완료");
  const candidates = STAFF.filter((s) => s.id !== staff.id);
  const [toId, setToId] = useState(candidates[0]?.id ?? "");

  const submit = () => {
    active.forEach((p) => replaceMember(p.id, staff.id, toId));
    notify(`${staff.name}님의 프로젝트 ${active.length}개를 ${findStaff(toId).name}님에게 넘겼어요.`);
    logActivity(`${staff.name}님의 프로젝트 ${active.length}개를 ${findStaff(toId).name}님에게 넘김`);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${staff.name}님 프로젝트 넘기기`}
      description="참여 중인 프로젝트에서 한꺼번에 교체해요. 대화·문서·약속은 프로젝트에 그대로 남고, 새 사람은 각 프로젝트 개요부터 읽으면 돼요."
      footer={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={submit} disabled={!toId || active.length === 0}>
            {active.length}개 넘기기
          </Button>
        </>
      }
    >
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">넘길 프로젝트 (진행 중·대기)</p>
        <ul className="space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
          {active.map((p) => (
            <li key={p.id}>· {p.name}</li>
          ))}
        </ul>
        <p className="mt-1.5 text-xs text-slate-500">끝난 프로젝트는 기록으로 남겨 두고 넘기지 않아요.</p>
      </div>
      <Field label="이어받을 사람">
        <select value={toId} onChange={(e) => setToId(e.target.value)} className={inputClass}>
          {candidates.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.team} {s.title}
            </option>
          ))}
        </select>
      </Field>
    </Modal>
  );
}
