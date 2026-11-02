import { Suspense } from "react";
import { ProjectDetail } from "@/components/projects/project-detail";

// 기능정리 3-2, 5-1~5-3, 6-2
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <ProjectDetail id={id} />
    </Suspense>
  );
}
