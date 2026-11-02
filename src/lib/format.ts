import { DEMO_NOW } from "./mock-data";

const pad = (n: number) => String(n).padStart(2, "0");

/** 시:분 */
export function formatClock(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 오늘이면 시:분, 아니면 월/일 */
export function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date(DEMO_NOW);
  if (d.toDateString() === now.toDateString()) return formatClock(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 대화창 날짜 구분선. 예: 10월 29일 (목) */
export function formatDay(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${"일월화수목금토"[d.getDay()]})`;
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export function daysSince(iso: string) {
  return Math.floor((new Date(DEMO_NOW).getTime() - new Date(iso).getTime()) / 86_400_000);
}

/** 마감까지 남은 날. 0이면 오늘, 음수면 지남 */
export function daysUntil(iso: string) {
  const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((day(new Date(iso)) - day(new Date(DEMO_NOW))) / 86_400_000);
}
