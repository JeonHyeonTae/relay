"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useDemo } from "@/lib/demo-context";
import { STAFF, findStaff } from "@/lib/mock-data";
import type { Project } from "@/lib/types";

interface MemberDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  /** 바꿀 사람. 없으면 새로 추가한다 */
  replacing?: string;
  onReplaced?: (fromName: string, toName: string) => void;
}

/** 프로젝트 참여자 추가·교체. 사람이 바뀌어도 대화·문서는 프로젝트에 그대로 남는다 (기능정리 3-3) */
export function MemberDialog({ open, onClose, project, replacing, onReplaced }: MemberDialogProps) {
  const { addMember, replaceMember, notify, logActivity } = useDemo();
  const candidates = STAFF.filter((s) => !project.memberIds.includes(s.id));
  const [staffId, setStaffId] = useState(candidates[0]?.id ?? "");

  const submit = () => {
    const to = findStaff(staffId);
    if (replacing) {
      const from = findStaff(replacing);
      replaceMember(project.id, replacing, staffId);
      notify(`${from.name}님 대신 ${to.name}님이 참여해요.`);
      logActivity(`'${project.name}' 참여자 ${from.name} → ${to.name} 교체`);
      onReplaced?.(from.name, to.name);
    } else {
      addMember(project.id, staffId);
      notify(`${to.name}님을 참여자로 추가했어요.`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={replacing ? `${findStaff(replacing).name}님 교체` : "참여자 추가"}
      description={
        replacing
          ? "대화·문서·약속은 프로젝트에 그대로 남고, 맡던 대화는 새 사람에게 넘어가요. 새 사람은 개요의 요약과 지금 할 일로 바로 시작할 수 있어요."
          : "추가한 사람은 이 프로젝트의 대화와 문서를 함께 봐요."
      }
      footer={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={submit} disabled={!staffId}>
            {replacing ? "교체" : "추가"}
          </Button>
        </>
      }
    >
      {candidates.length === 0 ? (
        <p className="text-sm text-slate-500">팀원이 모두 참여하고 있어요.</p>
      ) : (
        <Field label={replacing ? "새로 맡을 사람" : "추가할 사람"}>
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className={inputClass}>
            {candidates.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.team} {s.title}
                {s.note ? ` (${s.note})` : ""}
              </option>
            ))}
          </select>
        </Field>
      )}
    </Modal>
  );
}
