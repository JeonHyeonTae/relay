import { Suspense } from "react";
import { ClientList } from "@/components/clients/client-list";

// 기능정리 3-1
export default function ClientsPage() {
  return (
    <Suspense>
      <ClientList />
    </Suspense>
  );
}
