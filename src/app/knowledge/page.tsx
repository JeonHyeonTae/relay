import { Suspense } from "react";
import { KnowledgeView } from "@/components/knowledge/knowledge-view";

// 기능정리 5-1~5-6, 6-4
export default function KnowledgePage() {
  return (
    <Suspense>
      <KnowledgeView />
    </Suspense>
  );
}
