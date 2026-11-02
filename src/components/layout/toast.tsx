"use client";

import { CircleCheck } from "lucide-react";
import { useDemo } from "@/lib/demo-context";

export function Toast() {
  const { notice } = useDemo();
  if (!notice) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
      <CircleCheck className="size-4 text-emerald-400" />
      {notice}
    </div>
  );
}
