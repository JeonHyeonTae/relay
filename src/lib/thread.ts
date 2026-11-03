import { findStaff } from "./mock-data";
import type { Message, Staff, Thread } from "./types";

/** 내가 속한 채팅방: 내가 맡은 대화, 나와의 1:1, 내가 참여자인 단체방, 내가 보낸 메시지가 있는 대화 */
export function isMyChat(thread: Thread, me: Staff) {
  return (
    thread.ownerId === me.id ||
    Boolean(thread.group?.members.includes(me.name)) ||
    thread.messages.some((m) => m.authorId === me.id)
  );
}

/** 메시지를 개인 대화로 표시할 때 쓰는 값. 프로젝트 id와 겹치지 않는다 */
export const PERSONAL = "personal";

/**
 * 메시지가 쌓이는 곳: 프로젝트 id 여러 개, 개인 대화([PERSONAL]), 아무 데도 안 쌓임([]).
 * 표시가 없는 메시지는 채팅방에 처음 연결한 프로젝트로 본다. 연결을 끊은 프로젝트에는 쌓지 않는다
 */
export function messageTags(thread: Thread, m: Message): string[] {
  if (m.personal) return [PERSONAL];
  if (m.projectIds) return m.projectIds.filter((id) => thread.projectIds.includes(id));
  return thread.projectIds.slice(0, 1);
}

/** 답장을 쓸 때 처음 골라 둘 곳: 마지막으로 쌓인 메시지와 같은 곳. 연결한 프로젝트가 없으면 개인 대화 */
export function defaultTags(thread: Thread): string[] {
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    const tags = messageTags(thread, thread.messages[i]);
    if (tags.length) return tags;
  }
  return thread.projectIds.length ? [thread.projectIds[0]] : [PERSONAL];
}

/** 쌓을 곳 하나를 켜고 끈다. 개인 대화는 프로젝트와 함께 고를 수 없고, 프로젝트는 마지막 하나를 끌 수 없다 */
export function toggleTag(tags: string[], id: string): string[] {
  if (id === PERSONAL) return [PERSONAL];
  const picked = tags.filter((t) => t !== PERSONAL);
  if (!picked.includes(id)) return [...picked, id];
  return picked.length > 1 ? picked.filter((t) => t !== id) : picked;
}

/** 메시지마다 어디에 쌓이는지 보여 줄 방: 여러 프로젝트에 연결했거나 개인 대화가 섞였을 때 */
export function needsTags(thread: Thread) {
  return thread.projectIds.length > 1 || thread.messages.some((m) => m.personal);
}

/** 새로 만든 채팅방은 메시지가 없을 수 있다 */
export function lastMessage(thread: Thread): Message | undefined {
  return thread.messages[thread.messages.length - 1];
}

export function lastAt(thread: Thread) {
  return new Date(lastMessage(thread)?.at ?? thread.startedAt ?? 0).getTime();
}

/** 대화 목록에 보여 줄 채팅방 이름: 단체방 이름 → 메일 제목 → 1:1 상대 이름 */
export function roomName(thread: Thread, myId: string) {
  if (thread.group?.name) return thread.group.name;
  if (thread.dmWith) return findStaff(thread.dmWith).name;
  if (thread.channel === "email") return thread.title;
  const other = thread.messages.find((m) => !m.authorId) ?? thread.messages.find((m) => m.authorId !== myId);
  return other?.authorName ?? thread.title;
}

/** 근거 문서 없이 만드는 일반 안내 초안. 동료와만 나눈 사내 대화면 짧은 확인 답장 */
export function genericDraft(thread: Thread, myId: string) {
  const latest = [...thread.messages].reverse();
  const customer = latest.find((m) => !m.authorId);
  if (!customer) {
    const colleague = latest.find((m) => m.authorId !== myId);
    return `${colleague?.authorName ?? ""}님, 확인했습니다. 감사합니다.`;
  }
  return `${customer.authorName}님, 안녕하세요. 문의 주신 내용 확인했습니다. 담당자 확인 후 오늘 중으로 자세히 안내드리겠습니다.`;
}
