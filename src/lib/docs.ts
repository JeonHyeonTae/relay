import { CHANNELS } from "./channels";
import { daysSince } from "./format";
import type { DocSource, KnowledgeDoc } from "./types";

/** 이만큼 바뀌지 않은 문서는 내용이 낡았을 수 있어 확인을 요청한다 (기능정리 5-6) */
export const STALE_DAYS = 180;

/** staleMonths는 팀 설정의 "자료 최신화 기준" */
export function isStale(doc: KnowledgeDoc, staleMonths = STALE_DAYS / 30) {
  return daysSince(doc.updatedAt) > staleMonths * 30;
}

/**
 * AI가 답장할 때 자료를 보는 순서 (기능정리 5-5).
 * standard: 회사 기준(모든 답장에 먼저), company: 회사 자료(맞을 때만),
 * account: 고객사 공통 자료(그 회사 스페이스 답장에만), project: 그 스페이스 자료
 */
export type DocLayer = "standard" | "company" | "account" | "project";

export const LAYER_ORDER: Record<DocLayer, number> = { standard: 0, company: 1, account: 2, project: 3 };

export function docLayer(doc: KnowledgeDoc): DocLayer {
  if (doc.projectId) return "project";
  if (doc.accountId) return "account";
  return doc.priority ? "standard" : "company";
}

export function sourceLabel(source: DocSource) {
  return source === "upload" ? "직접 업로드" : `${CHANNELS[source].short} 첨부에서 자동 저장`;
}

/** 원본 파일을 내려받는다. 데모에는 원본이 없어 알림 문구만 돌려준다 */
export function downloadNotice(doc: KnowledgeDoc) {
  return `데모에는 원본 파일이 없어요. 실제로는 '${doc.title}' 원본을 내려받아요.`;
}

/** 스페이스 문서는 스페이스 화면에서, 회사 공통·고객사 공통 문서는 지식 베이스에서 연다 */
export function docHref(doc: KnowledgeDoc) {
  return doc.projectId ? `/spaces/${doc.projectId}?doc=${doc.id}` : `/knowledge?doc=${doc.id}`;
}
