"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ACCOUNTS,
  ACTIVITY,
  CHANNEL_ACCOUNTS,
  DEMO_NOW,
  DOCS,
  LEAD_ID,
  MEMBER_ID,
  PROJECTS,
  SIMILAR_CASES,
  THREADS,
  findStaff,
} from "./mock-data";
import { CHANNELS } from "./channels";
import { PERSONAL } from "./thread";
import type {
  Account,
  ActivityEntry,
  ChannelAccount,
  ChannelId,
  Contact,
  KnowledgeDoc,
  Preferences,
  Project,
  Role,
  SendMode,
  Staff,
  TeamSettings,
  Thread,
} from "./types";

interface DemoContextValue {
  role: Role;
  setRole: (role: Role) => void;
  currentUser: Staff;
  accounts: Account[];
  projects: Project[];
  threads: Thread[];
  docs: KnowledgeDoc[];
  /** 채널에 연결한 계정. 한 사람이 채널마다 여러 개 */
  channelAccounts: ChannelAccount[];
  /** 계정이 하나라도 연결된 채널 */
  connected: ChannelId[];
  /** 사람이 고친 뒤 보낸 초안 수. 모아서 일괄 학습 (기능정리 2-6) */
  learnedEdits: number;
  notice: string | null;
  notify: (message: string) => void;
  prefs: Preferences;
  setPrefs: (patch: Partial<Preferences>) => void;
  team: TeamSettings;
  setTeam: (patch: Partial<TeamSettings>) => void;
  /** 팀 설정의 자동 발송 허용을 반영한 채널 발송 방식 */
  sendModeOf: (channel: ChannelId) => SendMode;
  /** 활동 기록 (보안 검토용) */
  activity: ActivityEntry[];
  logActivity: (text: string) => void;
  /** tags: 이 메시지를 쌓을 스페이스 id들(여러 개 가능), 또는 [PERSONAL](개인 대화라 쌓지 않음) */
  sendReply: (threadId: string, body: string, edited: boolean, tags: string[]) => void;
  /** 받은 메시지 등 이미 있는 메시지가 쌓일 곳을 바꾼다 */
  tagMessage: (threadId: string, messageId: string, tags: string[]) => void;
  /** 스페이스에 채팅방을 연결한다. 한 채팅방을 여러 스페이스에 연결할 수 있다 */
  linkThreads: (projectId: string, threadIds: string[]) => void;
  unlinkThread: (projectId: string, threadId: string) => void;
  markRead: (threadId: string) => void;
  setAiReply: (threadId: string, on: boolean) => void;
  /** 대화별로 답장 초안에 참고한 비슷한 과거 건 */
  caseDrafts: Record<string, string>;
  setCaseDraft: (threadId: string, caseId: string) => void;
  /** 동료와의 1:1 채팅에서 물어보려는 과거 건과 지금 문의 */
  askDrafts: Record<string, AskDraft>;
  /** 과거 건을 처리한 사람과의 1:1 채팅을 열고(없으면 만들고) 그 채팅 id를 돌려준다 */
  askAbout: (caseId: string, fromThreadId: string) => string;
  /** 자동으로 모은 연락처를 사람이 고친다 */
  updateContact: (accountId: string, name: string, patch: Partial<Omit<Contact, "name">>) => void;
  addMember: (projectId: string, staffId: string) => void;
  removeMember: (projectId: string, staffId: string) => void;
  /** 사람을 바꾸면 그 사람이 맡던 대화도 새 사람에게 넘어간다 (기능정리 3-3) */
  replaceMember: (projectId: string, fromId: string, toId: string) => void;
  addProject: (project: Omit<Project, "id">) => void;
  addDoc: (doc: Omit<KnowledgeDoc, "id">) => void;
  /** 회사 공통 문서를 회사 기준(모든 답장에 먼저 적용)으로 쓸지 */
  setDocPriority: (docId: string, on: boolean) => void;
  addChannelAccount: (account: Omit<ChannelAccount, "id" | "ownerId">) => void;
  updateChannelAccount: (id: string, patch: Partial<Pick<ChannelAccount, "label" | "shared">>) => void;
  removeChannelAccount: (id: string) => void;
}

export interface AskDraft {
  caseId: string;
  fromThreadId: string;
}

const DEFAULT_PREFS: Preferences = {
  notifyNewMessage: true,
  notifyReplyNeeded: true,
  notifyColleagueReply: true,
  signature: "",
  aiReplyDefault: true,
};

const DEFAULT_TEAM: TeamSettings = {
  autoSendChannels: (Object.keys(CHANNELS) as ChannelId[]).filter((id) => CHANNELS[id].sendMode === "auto"),
  catchUpMin: 5,
  staleMonths: 6,
  downloadScope: "all",
  mondayConnected: true,
  mondayBoard: "영업1팀 프로젝트",
};

/**
 * 연결을 바꾸기 전에 표시 없는 메시지를 지금 쌓이는 곳(처음 연결한 스페이스)으로 굳혀 둔다.
 * 그래야 연결을 끊거나 더해도 이미 쌓인 메시지가 다른 스페이스로 옮겨 가지 않는다
 */
function pinTags(t: Thread): Thread {
  const first = t.projectIds[0];
  if (!first) return t;
  return { ...t, messages: t.messages.map((m) => (m.personal || m.projectIds ? m : { ...m, projectIds: [first] })) };
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("member");
  const [accounts, setAccounts] = useState(ACCOUNTS);
  const [projects, setProjects] = useState(PROJECTS);
  const [threads, setThreads] = useState(THREADS);
  const [docs, setDocs] = useState(DOCS);
  const [channelAccounts, setChannelAccounts] = useState(CHANNEL_ACCOUNTS);
  const connected = useMemo(() => Array.from(new Set(channelAccounts.map((a) => a.channel))), [channelAccounts]);
  const [learnedEdits, setLearnedEdits] = useState(0);
  const [caseDrafts, setCaseDrafts] = useState<Record<string, string>>({});
  const [activity, setActivity] = useState<ActivityEntry[]>(ACTIVITY);
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULT_PREFS);
  const [team, setTeamState] = useState<TeamSettings>(DEFAULT_TEAM);
  const setPrefs = useCallback((patch: Partial<Preferences>) => setPrefsState((prev) => ({ ...prev, ...patch })), []);
  const setTeam = useCallback((patch: Partial<TeamSettings>) => setTeamState((prev) => ({ ...prev, ...patch })), []);
  const sendModeOf = useCallback(
    (channel: ChannelId): SendMode => {
      const base = CHANNELS[channel].sendMode;
      return base === "auto" && !team.autoSendChannels.includes(channel) ? "draft" : base;
    },
    [team.autoSendChannels],
  );
  const [askDrafts, setAskDrafts] = useState<Record<string, AskDraft>>({});
  const askDraftsRef = useRef(askDrafts);
  askDraftsRef.current = askDrafts;
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentCount = useRef(0);

  const currentUser = findStaff(role === "lead" ? LEAD_ID : MEMBER_ID);

  const notify = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3000);
  }, []);

  // 데모 안에서 시간이 흐르는 것처럼 1분씩 늘린다
  const nextAt = useCallback(() => {
    sentCount.current += 1;
    return new Date(new Date(DEMO_NOW).getTime() + sentCount.current * 60_000).toISOString();
  }, []);

  const logActivity = useCallback(
    (text: string) => {
      const entry = { id: `act-${Date.now()}-${Math.random()}`, at: nextAt(), staffId: currentUser.id, text };
      setActivity((prev) => [entry, ...prev]);
    },
    [currentUser, nextAt],
  );

  const sendReply = useCallback(
    (threadId: string, body: string, edited: boolean, tags: string[]) => {
      const at = nextAt();
      const personal = tags.includes(PERSONAL);
      const message = {
        id: `sent-${sentCount.current}`,
        authorId: currentUser.id,
        authorName: currentUser.name,
        body,
        at,
        ...(personal ? { personal: true } : { projectIds: tags }),
      };
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, needsReply: false, aiDraft: undefined, messages: [...t.messages, message] } : t,
        ),
      );
      // 보내고 나면 과거 건·물어보기 초안은 끝난다
      setCaseDrafts(({ [threadId]: _, ...rest }) => rest);
      const ask = askDraftsRef.current[threadId];
      if (ask) {
        setAskDrafts(({ [threadId]: _, ...rest }) => rest);
        const c = SIMILAR_CASES.find((x) => x.id === ask.caseId);
        if (c?.askReply) {
          // 물어본 사람이 잠시 뒤 답한다 (데모)
          const staff = findStaff(c.ownerId);
          setTimeout(() => {
            const reply = { id: `reply-${threadId}-${Date.now()}`, authorId: staff.id, authorName: staff.name, body: c.askReply!, at: nextAt() };
            setThreads((prev) =>
              prev.map((t) => (t.id === threadId ? { ...t, messages: [...t.messages, reply], unread: (t.unread ?? 0) + 1 } : t)),
            );
            notify(`${staff.name}님이 답했어요.`);
          }, 2500);
        }
      }
      // 개인 대화는 스페이스에 쌓지 않고 학습에도 쓰지 않는다
      if (personal) {
        notify("발송했어요. 개인 대화라 스페이스에 쌓지 않아요.");
      } else if (edited) {
        setLearnedEdits((n) => n + 1);
        notify("발송했어요. 고친 초안은 학습 데이터로 저장했어요.");
      } else {
        notify("발송했어요.");
      }
    },
    [currentUser, notify, nextAt],
  );

  const tagMessage = useCallback((threadId: string, messageId: string, tags: string[]) => {
    const personal = tags.includes(PERSONAL);
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              messages: t.messages.map((m) =>
                m.id === messageId
                  ? { ...m, personal: personal || undefined, projectIds: personal ? undefined : tags }
                  : m,
              ),
            }
          : t,
      ),
    );
  }, []);

  const linkThreads = useCallback((projectId: string, threadIds: string[]) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (!threadIds.includes(t.id) || t.projectIds.includes(projectId)) return t;
        const pinned = pinTags(t);
        return { ...pinned, projectIds: [...pinned.projectIds, projectId] };
      }),
    );
  }, []);

  const unlinkThread = useCallback((projectId: string, threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        const pinned = pinTags(t);
        return { ...pinned, projectIds: pinned.projectIds.filter((id) => id !== projectId) };
      }),
    );
  }, []);

  const markRead = useCallback((threadId: string) => {
    setThreads((prev) =>
      prev.some((t) => t.id === threadId && t.unread)
        ? prev.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t))
        : prev,
    );
  }, []);

  const setAiReply = useCallback((threadId: string, on: boolean) => {
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, aiReply: on } : t)));
  }, []);

  const setCaseDraft = useCallback((threadId: string, caseId: string) => {
    setCaseDrafts((prev) => ({ ...prev, [threadId]: caseId }));
  }, []);

  const askAbout = useCallback(
    (caseId: string, fromThreadId: string) => {
      const c = SIMILAR_CASES.find((x) => x.id === caseId);
      const from = threads.find((t) => t.id === fromThreadId);
      if (!c || !from) return fromThreadId;
      // 이미 그 사람과 1:1 채팅이 있으면 그 방, 없으면 새로 만든다.
      // 논의 필요: 1:1 채팅을 고객사·스페이스에 묶으면 소통 내역에 보인다 (화면별_기능정리.md "논의할 것")
      let chatId = threads.find((t) => t.dmWith === c.ownerId && t.ownerId === currentUser.id)?.id;
      if (!chatId) {
        const id = `dm-${c.ownerId}-${Date.now()}`;
        chatId = id;
        const chat: Thread = {
          id,
          accountId: from.accountId,
          // 동료와의 1:1 채팅은 스페이스에 연결하지 않고 시작한다. 필요하면 스페이스 화면에서 연결한다
          projectIds: [],
          channel: "gchat",
          via: channelAccounts.find((a) => a.channel === "gchat" && a.ownerId === currentUser.id)?.id,
          title: findStaff(c.ownerId).name,
          dmWith: c.ownerId,
          startedAt: nextAt(),
          ownerId: currentUser.id,
          visibility: "shared",
          needsReply: false,
          aiReply: prefs.aiReplyDefault,
          messages: [],
        };
        setThreads((prev) => [chat, ...prev]);
      }
      setAskDrafts((prev) => ({ ...prev, [chatId]: { caseId, fromThreadId } }));
      return chatId;
    },
    [threads, currentUser, nextAt, prefs.aiReplyDefault, channelAccounts],
  );

  const updateContact = useCallback((accountId: string, name: string, patch: Partial<Omit<Contact, "name">>) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId ? { ...a, contacts: a.contacts.map((c) => (c.name === name ? { ...c, ...patch } : c)) } : a,
      ),
    );
  }, []);

  const updateMembers = useCallback((projectId: string, change: (ids: string[]) => string[]) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, memberIds: change(p.memberIds) } : p)));
  }, []);

  const addMember = useCallback(
    (projectId: string, staffId: string) => updateMembers(projectId, (ids) => (ids.includes(staffId) ? ids : [...ids, staffId])),
    [updateMembers],
  );

  const removeMember = useCallback(
    (projectId: string, staffId: string) => updateMembers(projectId, (ids) => ids.filter((id) => id !== staffId)),
    [updateMembers],
  );

  const replaceMember = useCallback(
    (projectId: string, fromId: string, toId: string) => {
      updateMembers(projectId, (ids) => ids.map((id) => (id === fromId ? toId : id)).filter((id, i, all) => all.indexOf(id) === i));
      // 동료와의 1:1 채팅은 그 사람 것이라 넘기지 않는다
      setThreads((prev) =>
        prev.map((t) => (t.projectIds.includes(projectId) && t.ownerId === fromId && !t.dmWith ? { ...t, ownerId: toId } : t)),
      );
    },
    [updateMembers],
  );

  const addProject = useCallback((project: Omit<Project, "id">) => {
    setProjects((prev) => [...prev, { ...project, id: `p${prev.length + 1}-${Date.now()}` }]);
  }, []);

  const addDoc = useCallback((doc: Omit<KnowledgeDoc, "id">) => {
    setDocs((prev) => [{ ...doc, id: `doc-${Date.now()}` }, ...prev]);
  }, []);

  const setDocPriority = useCallback((docId: string, on: boolean) => {
    setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, priority: on } : d)));
  }, []);

  const addChannelAccount = useCallback(
    (account: Omit<ChannelAccount, "id" | "ownerId">) => {
      setChannelAccounts((prev) => [...prev, { ...account, id: `ca-${Date.now()}`, ownerId: currentUser.id }]);
    },
    [currentUser],
  );

  const updateChannelAccount = useCallback((id: string, patch: Partial<Pick<ChannelAccount, "label" | "shared">>) => {
    setChannelAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const removeChannelAccount = useCallback((id: string) => {
    setChannelAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      role,
      setRole,
      currentUser,
      accounts,
      projects,
      threads,
      docs,
      channelAccounts,
      connected,
      learnedEdits,
      notice,
      notify,
      prefs,
      setPrefs,
      team,
      setTeam,
      sendModeOf,
      activity,
      logActivity,
      sendReply,
      tagMessage,
      linkThreads,
      unlinkThread,
      markRead,
      setAiReply,
      caseDrafts,
      setCaseDraft,
      askDrafts,
      askAbout,
      updateContact,
      addMember,
      removeMember,
      replaceMember,
      addProject,
      addDoc,
      setDocPriority,
      addChannelAccount,
      updateChannelAccount,
      removeChannelAccount,
    }),
    [
      role,
      currentUser,
      accounts,
      projects,
      threads,
      docs,
      channelAccounts,
      connected,
      learnedEdits,
      notice,
      notify,
      prefs,
      setPrefs,
      team,
      setTeam,
      sendModeOf,
      activity,
      logActivity,
      sendReply,
      tagMessage,
      linkThreads,
      unlinkThread,
      markRead,
      setAiReply,
      caseDrafts,
      setCaseDraft,
      askDrafts,
      askAbout,
      updateContact,
      addMember,
      removeMember,
      replaceMember,
      addProject,
      addDoc,
      setDocPriority,
      addChannelAccount,
      updateChannelAccount,
      removeChannelAccount,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo는 DemoProvider 안에서만 쓸 수 있습니다.");
  return ctx;
}

/** 개인에게 온 연락은 본인만, 팀장은 팀원 내역까지 열람 (기능정리 6-2) */
export function visibleThreads(threads: Thread[], user: Staff, role: Role) {
  if (role === "lead") return threads;
  return threads.filter((t) => t.visibility === "shared" || t.ownerId === user.id);
}
