"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { SCENARIOS, type ScenarioKey } from "@/lib/bulk-mail";
import { useDemo } from "@/lib/demo-context";
import { BulkSendDialog } from "./bulk-send-dialog";

/** 거래 중인 고객사 목록. 회사를 누르면 그 회사와 한 스페이스들이 나온다 (기능정리 3-1).
    공지·정기 일정·계약 갱신처럼 여러 곳에 같은 일로 보낼 메일은 여기서 한 번에 보낸다 */
export function ClientList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accounts, projects } = useDemo();
  const [query, setQuery] = useState("");
  // 오늘 할 일의 제안에서 ?send=상황 으로 오면 그 상황으로 바로 연다
  const asked = searchParams.get("send");
  const [sending, setSending] = useState<ScenarioKey | null>(
    SCENARIOS.some((s) => s.key === asked) ? (asked as ScenarioKey) : null,
  );

  // 회사 이름, 업종, 연락처 이름으로 찾는다
  const q = query.trim().toLowerCase();
  const rows = accounts
    .filter((a) => !q || [a.name, a.industry, ...a.contacts.map((c) => c.name)].some((t) => t.toLowerCase().includes(q)))
    .map((account) => {
      const accountProjects = projects.filter((p) => p.accountId === account.id);
      return {
        account,
        total: accountProjects.length,
        active: accountProjects.filter((p) => p.status === "진행 중").length,
        waiting: accountProjects.filter((p) => p.status === "대기").length,
        done: accountProjects.filter((p) => p.status === "완료").length,
      };
    })
    // 진행 중인 스페이스가 많은 회사가 위로, 다음은 대기, 같으면 가나다순
    .sort((a, b) => b.active - a.active || b.waiting - a.waiting || a.account.name.localeCompare(b.account.name, "ko"));

  return (
    <div className="pb-10">
      <PageHeader
        title="고객사"
        description="거래 중인 고객사 목록이에요. 회사를 누르면 그 회사와 진행한 스페이스를 볼 수 있어요."
        actions={
          <Button variant="primary" onClick={() => setSending("notice")}>
            <Mail className="size-4" />
            여러 고객사에 메일 보내기
          </Button>
        }
      />

      <div className="mx-8 mb-3 flex flex-wrap items-center gap-2">
        <p className="text-xs text-slate-500">공지, 정기 일정 잡기, 계약 갱신 안내처럼 여러 곳에 같은 일로 보낼 메일은 위 버튼으로 한 번에 보내요.</p>
        <SearchInput value={query} onChange={setQuery} placeholder="회사·업종·연락처 이름 검색" className="ml-auto" />
      </div>

      {rows.length === 0 ? (
        <p className="mx-8 rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
          검색에 맞는 고객사가 없어요.
        </p>
      ) : (
        <div className="mx-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs whitespace-nowrap text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">회사</th>
                <th className="hidden px-4 py-2.5 font-medium lg:table-cell">업종</th>
                <th className="px-4 py-2.5 font-medium">진행 중</th>
                <th className="px-4 py-2.5 font-medium">대기</th>
                <th className="px-4 py-2.5 font-medium">완료</th>
                <th className="px-4 py-2.5 font-medium">전체</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ account, total, active, waiting, done }) => (
                <tr
                  key={account.id}
                  onClick={() => router.push(`/clients/${account.id}`)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    <Link href={`/clients/${account.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-brand-600">
                      {account.name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">{account.industry}</td>
                  <td className="px-4 py-3">
                    {active > 0 ? <Badge className="bg-brand-50 text-brand-700">{active}개</Badge> : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{waiting > 0 ? `${waiting}개` : <span className="text-slate-300">-</span>}</td>
                  <td className="px-4 py-3 text-slate-500">{done > 0 ? `${done}개` : <span className="text-slate-300">-</span>}</td>
                  <td className="px-4 py-3 text-slate-500">{total}개</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sending && <BulkSendDialog initialScenario={sending} onClose={() => setSending(null)} />}
    </div>
  );
}
