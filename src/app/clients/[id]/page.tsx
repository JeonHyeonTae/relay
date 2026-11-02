import { Suspense } from "react";
import { ClientDetail } from "@/components/clients/client-detail";

// 기능정리 3-1, 3-2
export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <ClientDetail id={id} />
    </Suspense>
  );
}
