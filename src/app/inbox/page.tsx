import { Suspense } from "react";
import { InboxView } from "@/components/inbox/inbox-view";

// 기능정리 1-1~1-3, 2-1~2-6, 4-1~4-2
export default function InboxPage() {
  return (
    <Suspense>
      <InboxView />
    </Suspense>
  );
}
