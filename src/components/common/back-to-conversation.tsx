"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { threadHref } from "@/components/inbox/thread-link";
import { useDemo } from "@/lib/demo-context";
import { roomName } from "@/lib/thread";

/** 수신함 대화에서 넘어왔으면(?from=대화 id) 그 대화로 돌아가는 링크 */
export function BackToConversation() {
  const from = useSearchParams().get("from");
  const { threads, currentUser } = useDemo();
  const thread = threads.find((t) => t.id === from);
  if (!thread) return null;

  return (
    <Link
      href={threadHref(thread.id)}
      className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700 hover:bg-brand-100"
    >
      <ArrowLeft className="size-3.5" />
      <span className="font-medium">{roomName(thread, currentUser.id)}</span> 대화로 돌아가기
    </Link>
  );
}
