import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/types";

const STATUS_COLOR: Record<Project["status"], string> = {
  "진행 중": "bg-brand-50 text-brand-700",
  대기: "bg-amber-50 text-amber-700",
  완료: "bg-slate-100 text-slate-500",
};

/** 프로젝트 상태. 목록에서 한눈에 구분되도록 상태마다 색을 다르게 한다 */
export function ProjectStatusBadge({ status }: { status: Project["status"] }) {
  return <Badge className={STATUS_COLOR[status]}>{status}</Badge>;
}
