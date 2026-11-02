import type { ChannelId, SendMode } from "./types";

interface ChannelMeta {
  label: string;
  short: string;
  color: string;
  sendMode: SendMode;
  note: string;
  /** 계정을 구분하는 값의 이름과 예시. 한 채널에 계정을 여러 개 연결할 수 있다 */
  account: { label: string; example: string };
}

// 채널별 발송 방식은 데모용 가정이다. 실제 API 조사 후 바꾼다.
export const CHANNELS: Record<ChannelId, ChannelMeta> = {
  email: {
    label: "이메일",
    short: "메일",
    color: "bg-sky-100 text-sky-700",
    sendMode: "auto",
    note: "Gmail·Outlook 등 메일 계정 연결",
    account: { label: "메일 주소", example: "seoyeon.park@relay.example" },
  },
  slack: {
    label: "Slack",
    short: "Slack",
    color: "bg-purple-100 text-purple-700",
    sendMode: "auto",
    note: "본인이 멘션·초대된 대화만 수집",
    account: { label: "워크스페이스", example: "relay.slack.com" },
  },
  teams: {
    label: "Microsoft Teams",
    short: "Teams",
    color: "bg-brand-100 text-brand-700",
    sendMode: "draft",
    note: "팀즈 계정 권한 키 연결",
    account: { label: "Teams 계정", example: "seoyeon.park@relay.example" },
  },
  whatsapp: {
    label: "WhatsApp",
    short: "WhatsApp",
    color: "bg-emerald-100 text-emerald-700",
    sendMode: "draft",
    note: "WhatsApp Business 계정 연결",
    account: { label: "WhatsApp Business 번호", example: "+82 10-0000-0000" },
  },
  kakao: {
    label: "카카오톡 채널",
    short: "카카오",
    color: "bg-yellow-100 text-yellow-800",
    sendMode: "auto",
    note: "카카오 채널 API 연결 (개인 카카오톡은 불가)",
    account: { label: "카카오톡 채널 이름", example: "릴레이 비즈 채널" },
  },
  channeltalk: {
    label: "채널톡",
    short: "채널톡",
    color: "bg-violet-100 text-violet-700",
    sendMode: "auto",
    note: "채널톡 API 키 연결",
    account: { label: "채널톡 채널 이름", example: "릴레이 고객지원" },
  },
  gchat: {
    label: "사내 메신저",
    short: "사내",
    color: "bg-slate-200 text-slate-700",
    sendMode: "auto",
    note: "구글 챗 등. 동료에게 받은 연락도 함께 모아 답장",
    account: { label: "계정", example: "seoyeon.park@relay.example" },
  },
  "kakao-file": {
    label: "카톡 대화 파일",
    short: "카톡 파일",
    color: "bg-amber-100 text-amber-800",
    sendMode: "receive",
    note: "대화 내보내기 파일 업로드 (크레딧 차감)",
    account: { label: "대화방", example: "" },
  },
};

export const SEND_MODE_LABEL: Record<SendMode, string> = {
  auto: "자동 발송 가능",
  draft: "초안만",
  receive: "수신만",
};

export const CONNECTABLE_CHANNELS = (Object.keys(CHANNELS) as ChannelId[]).filter(
  (id) => id !== "kakao-file",
);
