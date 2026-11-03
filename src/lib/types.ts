export type ChannelId =
  | "email"
  | "slack"
  | "teams"
  | "whatsapp"
  | "kakao"
  | "channeltalk"
  | "gchat"
  | "kakao-file";

/** 자동 발송 가능 / 초안만 (기능정리 2-4). receive는 카톡 대화 파일처럼 가져오기만 하는 경우 */
export type SendMode = "auto" | "draft" | "receive";

export type Role = "member" | "lead";

/** 채널에 연결한 계정. 한 사람이 채널마다 여러 계정을 연결할 수 있다(메일 주소 여러 개, Slack 워크스페이스 여러 개 등) */
export interface ChannelAccount {
  id: string;
  channel: ChannelId;
  /** 메일 주소, 워크스페이스, 채널 이름, 번호 등 */
  address: string;
  /** 구분용 이름 (예: 내 메일, 영업팀 공용 메일) */
  label: string;
  /** 연결한 사람 */
  ownerId: string;
  /** 팀 공용 계정: 팀원 모두가 이 계정으로 온 연락을 받는다 */
  shared?: boolean;
}

export interface Staff {
  id: string;
  name: string;
  title: string;
  team: string;
  note?: string;
}

/** 고객사 사람. 대화에서 자동으로 모으고 사람이 고칠 수 있다 */
export interface Contact {
  name: string;
  title: string;
  role: string;
  email?: string;
  phone?: string;
}

/** 고객사(거래 중인 회사). 사람은 회사가 아니라 스페이스 참여자로 관리한다 */
export interface Account {
  id: string;
  name: string;
  industry: string;
  contacts: Contact[];
}

/** 화면에서는 "스페이스"라고 부른다(2026-11-03 "프로젝트"에서 바꿈). 코드 이름은 project를 그대로 쓴다 */
export interface Project {
  id: string;
  accountId: string;
  name: string;
  status: "진행 중" | "대기" | "완료";
  channels: ChannelId[];
  /** 우리 쪽 참여자(직원 id). 사람이 바뀌면 여기서 넣고 빼고 교체한다 (기능정리 3-3) */
  memberIds: string[];
}

export interface Message {
  id: string;
  /** 우리 직원이 보낸 메시지면 직원 id, 고객이 보냈으면 없음 */
  authorId?: string;
  authorName: string;
  body: string;
  at: string;
  /**
   * 어느 스페이스 대화로 쌓을지. 한 메시지에 여러 스페이스 얘기가 섞이면 그 스페이스 모두에 쌓는다.
   * 보낼 때 고르고, 받은 메시지는 AI가 붙인다. 없으면 채팅방에 처음 연결한 스페이스
   */
  projectIds?: string[];
  /** 사적인 대화: 스페이스 소통 내역과 AI 학습에 쓰지 않는다 */
  personal?: boolean;
}

export interface Thread {
  id: string;
  accountId: string;
  /** 이 채팅방을 연결한 스페이스(n:m). 한 방에서 여러 스페이스 얘기를 하기도 하고, 사적인 연락처라 아무 데도 연결하지 않기도 한다 */
  projectIds: string[];
  channel: ChannelId;
  /** 이 대화가 들어온 계정(ChannelAccount id). 답장도 이 계정으로 나간다 */
  via?: string;
  /** 메일은 실제 제목, 메신저 대화는 AI가 붙인 요약. 수신함에는 메일 제목만 보여 주고, 요약은 검색·타임라인 링크 이름으로 쓴다 */
  title: string;
  /** 단체 대화: 채팅방 이름(메일은 없음)과 우리 직원을 포함한 참여자. 없으면 1:1 대화 */
  group?: { name?: string; members: string[] };
  /** 동료와의 1:1 채팅이면 그 직원 id */
  dmWith?: string;
  /** 메시지가 아직 없는 새 채팅방이 만들어진 때 */
  startedAt?: string;
  ownerId: string;
  /** personal: 받은 본인과 팀장만 열람 (기능정리 6-2) */
  visibility: "personal" | "shared";
  needsReply: boolean;
  /** 안 읽은 메시지 수. 대화를 열면 0이 된다 */
  unread?: number;
  /** 이 채팅방에서 AI 답장 초안을 쓸지. 없으면 켬 */
  aiReply?: boolean;
  isNewInquiry?: boolean;
  messages: Message[];
  aiDraft?: string;
  /** AI 초안이 근거로 쓴 문서·대화 */
  draftSources?: DraftSource[];
  similarCaseIds?: string[];
  /** 비슷한 과거 건을 찾은 기준: 지금 대화의 어느 메시지, 어떤 주제 */
  similarBasis?: { messageId: string; topic: string };
  detectedMeeting?: string;
  /** 안 읽은 메시지 AI 요약. 데모에서는 미리 만들어 둔다 */
  catchUp?: CatchUpPoint[];
}

/** 안 읽은 메시지 요약의 한 줄. messageIds는 근거가 된 원문 메시지 */
export interface CatchUpPoint {
  kind: "요청" | "정해진 것" | "해결됨";
  text: string;
  messageIds: string[];
}

export interface DraftSource {
  docId?: string;
  threadId?: string;
  /** 근거가 된 문장 */
  note: string;
}

export interface SimilarCase {
  id: string;
  title: string;
  /** 그 건이 있었던 스페이스와 대화 */
  projectId: string;
  threadId: string;
  /** 당시 처리한 직원 */
  ownerId: string;
  date: string;
  /** 지금 문의와 비슷한 점 */
  matchedOn: string[];
  /** 당시 어떻게 해결했는지 */
  resolution: string;
  /** 당시 견적·비용 */
  quote?: string;
  /** 이 건을 참고해 지금 어떻게 답하면 좋을지 */
  advice: string;
  /** advice대로 쓴 지금 대화의 답장 초안 */
  draft: string;
  /** 처리한 사람에게 물어보면 돌아오는 답 (데모용) */
  askReply?: string;
  match: number;
}

/** 스페이스를 이어받는 사람이 먼저 읽는 요약 (기능정리 3-3) */
export interface HandoverBrief {
  projectId: string;
  summary: string;
  openIssues: string[];
  promises: string[];
}

export type KnowledgeCategory = "문서" | "영업" | "회사 지식" | "고객사" | "스페이스";

export type DocKind = "제안서" | "견적서" | "계약서" | "회의록" | "사양서" | "보고서" | "매뉴얼" | "소개서" | "기타";

/** upload: 직접 올림, 채널 id: 그 채널의 첨부파일에서 자동 저장 */
export type DocSource = "upload" | ChannelId;

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: KnowledgeCategory;
  kind: DocKind;
  source: DocSource;
  /** 고객사 공통 자료: 그 고객사 모든 스페이스 답장에 참고. 계약 조건, 출입 수칙, 보안 요구사항 등 */
  accountId?: string;
  projectId?: string;
  updatedAt: string;
  ownerId: string;
  /** 매뉴얼·기본 세팅처럼 대화 내역보다 먼저 참조하는 문서 (기능정리 5-5) */
  priority: boolean;
  /** AI 답장 근거로 쓰인 횟수 */
  usedCount: number;
  summary: string;
  highlights: string[];
}

/** 대화·문서에서 뽑아 둔 스페이스 핵심 정보 */
export interface ProjectFact {
  id: string;
  projectId: string;
  label: string;
  value: string;
  docId?: string;
  threadId?: string;
}

/** 먼데이 상태 칼럼의 색. 보드마다 단계 이름이 달라 이름 대신 색을 받는다 */
export type MondayColor = "blue" | "amber" | "violet" | "emerald" | "rose" | "slate";

/** 먼데이 하위 아이템. 칼럼은 보드마다 다르지만 자주 쓰는 것만 받아온다 */
export interface MondayTask {
  name: string;
  status: "완료" | "진행 중" | "막힘" | "대기";
  due?: string;
  ownerId?: string;
  priority?: "높음" | "보통" | "낮음";
  /** 먼데이 텍스트 칼럼 */
  note?: string;
  /** 이 업무와 관련된 릴레이 대화 (연동할 때 연결해 둔다) */
  threadId?: string;
}

/** 스페이스와 연결된 먼데이 아이템. 원본은 먼데이에 있고 릴레이는 받아와 보여 준다 */
export interface MondayItem {
  projectId: string;
  stage: { label: string; color: MondayColor };
  /** 0~100 */
  progress: number;
  priority: "높음" | "보통" | "낮음";
  /** 먼데이 사람 칼럼 */
  ownerId: string;
  /** 예상 금액(만원) */
  amount?: number;
  /** 하위 아이템 */
  tasks: MondayTask[];
}

/** 누가 언제 무엇을 했는지 남는 기록 (보안 검토용, 기능정리 6-1, 6-3) */
export interface ActivityEntry {
  id: string;
  at: string;
  staffId: string;
  text: string;
}

/** 스페이스 회의. 회의록을 올리거나 노트테이커(2차 서비스) 녹음이 들어오면 AI가 정리한다 */
export interface Meeting {
  id: string;
  projectId: string;
  title: string;
  at: string;
  attendees: string[];
  source: "녹음" | "회의록";
  /** 회의록을 올린 경우 그 문서 */
  docId?: string;
  summary: string;
  decisions: string[];
  actions: { text: string; ownerId?: string; due?: string }[];
  /** AI가 쓴 후속 메일 초안 */
  followUp: string;
  /** 후속 메일을 이미 보냈다면 그 대화 */
  followUpThreadId?: string;
}

/** 내 설정: 누구나 자기 것만 바꾼다 */
export interface Preferences {
  notifyNewMessage: boolean;
  notifyReplyNeeded: boolean;
  notifyColleagueReply: boolean;
  /** 보낼 때 답장 끝에 붙는 서명 */
  signature: string;
  /** 새로 만드는 채팅방의 AI 답장 기본값 */
  aiReplyDefault: boolean;
}

/** 팀 설정: 팀장만 바꾼다 */
export interface TeamSettings {
  /** 자동 발송을 허용한 채널. 빠진 채널은 초안만(복사해서 보내기)으로 바뀐다 */
  autoSendChannels: ChannelId[];
  /** 안 읽은 메시지가 이만큼 쌓이면 요약 버튼을 띄운다 */
  catchUpMin: number;
  /** 이만큼(개월) 바뀌지 않은 자료는 최신화를 요청한다 */
  staleMonths: number;
  /** 원본 내려받기를 누가 할 수 있나 */
  downloadScope: "all" | "lead";
  mondayConnected: boolean;
  mondayBoard: string;
}
