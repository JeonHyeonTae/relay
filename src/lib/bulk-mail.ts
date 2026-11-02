import type { Account, MondayItem, Project } from "./types";

export type ScenarioKey = "notice" | "maintenance" | "renewal" | "custom";

interface Scenario {
  key: ScenarioKey;
  title: string;
  /** 어떤 고객사를 자동으로 고르는지 */
  rule: string;
  subject: string;
  body: string;
  /** 이 상황에 해당하는 프로젝트 (없으면 대상이 아님) */
  match: (projects: Project[]) => Project | undefined;
  /** 회사마다 덧붙이는 한 줄. AI가 프로젝트와 먼데이 정보로 맞춰 쓴 것으로 본다 */
  personalLine: (project: Project, monday?: MondayItem) => string | null;
}

const active = (p: Project) => p.status !== "완료";
const manwon = (n: number) => `${n.toLocaleString("ko-KR")}만원`;

/**
 * 여러 고객사에 한 번에 보내는 상황. 상황을 고르면 대상과 문구가 채워진다
 * (회의의 "200개 어카운트에 메일을 수기로 보내는 비효율")
 */
export const SCENARIOS: Scenario[] = [
  {
    key: "notice",
    title: "공지",
    rule: "진행 중이거나 대기 중인 프로젝트가 있는 고객사",
    subject: "[안내] 2027년 장비 표준 단가 변경",
    body: "{이름}님, 안녕하세요.\n2027년 1월 1일부터 장비 표준 단가가 바뀌어 미리 안내드립니다.\n바뀐 단가표는 첨부해 드렸습니다.\n감사합니다.",
    match: (projects) => projects.find(active),
    personalLine: (project) => `진행 중인 '${project.name}' 견적은 바뀌기 전 단가로 유지됩니다.`,
  },
  {
    key: "maintenance",
    title: "정기 일정 잡기",
    rule: "유지보수·정기점검 프로젝트가 진행 중인 고객사",
    subject: "[요청] 11월 정기점검 날짜 확인",
    body: "{이름}님, 안녕하세요.\n{프로젝트} 11월 점검 날짜를 정하려고 합니다.\n11/10~11/21 중 편하신 날짜 두 개를 알려 주세요.\n감사합니다.",
    match: (projects) => projects.find((p) => active(p) && /유지보수|점검/.test(p.name)),
    personalLine: (project, monday) => {
      const next = monday?.tasks.filter((t) => t.status !== "완료").sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""))[0];
      return next ? `지금 진행 중인 '${next.name}'도 함께 맞춰 드리겠습니다.` : null;
    },
  },
  {
    key: "renewal",
    title: "계약 갱신 안내",
    rule: "계약·갱신 프로젝트가 진행 중이거나 대기 중인 고객사",
    subject: "[안내] 계약 갱신 조건",
    body: "{이름}님, 안녕하세요.\n{프로젝트} 갱신 조건을 정리해 보내 드립니다.\n보시고 궁금한 점은 이 메일로 회신 주세요.\n감사합니다.",
    match: (projects) => projects.find((p) => active(p) && /계약|갱신/.test(p.name)),
    personalLine: (_project, monday) => (monday?.amount ? `현재 계약 금액은 ${manwon(monday.amount)}이고, 바뀌는 조건은 첨부에 표시해 드렸습니다.` : null),
  },
  {
    key: "custom",
    title: "직접 쓰기",
    rule: "직접 고른 고객사",
    subject: "",
    body: "{이름}님, 안녕하세요.\n\n감사합니다.",
    match: (projects) => projects.find((p) => p.status === "진행 중") ?? projects.find(active),
    personalLine: (project) => `진행 중인 '${project.name}'도 일정대로 챙기겠습니다.`,
  },
];

export function scenarioOf(key: ScenarioKey) {
  return SCENARIOS.find((s) => s.key === key) ?? SCENARIOS[0];
}

/** 상황에 맞는 고객사 id. 직접 쓰기는 자동으로 고르지 않는다 */
export function scenarioTargets(key: ScenarioKey, accounts: Account[], projects: Project[]) {
  if (key === "custom") return [];
  const scenario = scenarioOf(key);
  return accounts.filter((a) => scenario.match(projects.filter((p) => p.accountId === a.id))).map((a) => a.id);
}
