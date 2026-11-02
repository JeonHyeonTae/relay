"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useDemo } from "@/lib/demo-context";
import type { Contact } from "@/lib/types";

interface ContactDialogProps {
  accountId: string;
  contact: Contact;
  onClose: () => void;
}

/** 대화에서 자동으로 모은 고객사 연락처를 사람이 고친다 */
export function ContactDialog({ accountId, contact, onClose }: ContactDialogProps) {
  const { updateContact, notify } = useDemo();
  const [form, setForm] = useState({
    title: contact.title,
    role: contact.role,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
  });
  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
    className: inputClass,
  });

  const submit = () => {
    updateContact(accountId, contact.name, {
      title: form.title.trim(),
      role: form.role.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
    });
    notify(`${contact.name}님 연락처를 고쳤어요.`);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${contact.name} 연락처`}
      description="대화에서 자동으로 모은 정보예요. 틀리거나 빠진 부분을 고쳐 주세요."
      footer={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={submit}>
            저장
          </Button>
        </>
      }
    >
      <Field label="직함">
        <input {...field("title")} />
      </Field>
      <Field label="소속·역할">
        <input {...field("role")} placeholder="예: 구매팀 · 계약·단가" />
      </Field>
      <Field label="메일">
        <input {...field("email")} type="email" placeholder="예: name@company.com" />
      </Field>
      <Field label="전화">
        <input {...field("phone")} placeholder="예: 010-1234-5678" />
      </Field>
    </Modal>
  );
}
