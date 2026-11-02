"use client";

import { useState } from "react";
import { FileDrop } from "@/components/common/file-drop";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useDemo } from "@/lib/demo-context";

const UPLOAD_CREDITS = 50;

/** 연동이 안 되는 채널은 내보내기 파일 업로드로 수집, 크레딧 차감 (기능정리 1-7) */
export function KakaoFileDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { accounts, projects, notify } = useDemo();
  const [fileName, setFileName] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(accounts[0].id);
  const accountProjects = projects.filter((p) => p.accountId === accountId);
  const [projectId, setProjectId] = useState(accountProjects[0]?.id ?? "");

  const submit = () => {
    notify(`대화 파일을 올렸어요. 크레딧 ${UPLOAD_CREDITS}을 사용했어요.`);
    setFileName(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="카카오톡 대화 파일 올리기"
      description="카카오톡 대화방에서 '대화 내보내기'로 저장한 파일을 올려 주세요."
      footer={
        <>
          <span className="mr-auto self-center text-xs text-slate-500">크레딧 {UPLOAD_CREDITS} 차감</span>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={submit} disabled={!fileName || !projectId}>
            올리기
          </Button>
        </>
      }
    >
      <FileDrop fileName={fileName} onSelect={setFileName} accept=".txt,.csv,.zip" />
      <Field label="고객사">
        <select
          value={accountId}
          onChange={(e) => {
            setAccountId(e.target.value);
            setProjectId(projects.find((p) => p.accountId === e.target.value)?.id ?? "");
          }}
          className={inputClass}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="프로젝트">
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass}>
          {accountProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
    </Modal>
  );
}
