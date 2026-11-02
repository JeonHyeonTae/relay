"use client";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { COMMON_GUIDE, findGuide } from "@/lib/page-guides";

/** 지금 화면에서 할 수 있는 일을 오른쪽 서랍으로 보여준다 */
export function PageGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const guide = findGuide(pathname);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const shortcuts = [...(guide?.shortcuts ?? []), ...COMMON_GUIDE.shortcuts];

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/20" onMouseDown={onClose}>
      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-medium text-brand-600">화면 안내</p>
            <h2 className="mt-0.5 text-base font-semibold">{guide?.title ?? "릴레이"}</h2>
            {guide && <p className="mt-1 text-sm text-slate-500">{guide.summary}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="닫기">
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {guide && <FeatureList title="이 화면에서 할 수 있는 일" items={guide.features} numbered />}
          <FeatureList title="모든 화면 공통" items={COMMON_GUIDE.features} />
          <section>
            <h3 className="mb-2 text-xs font-semibold text-slate-500">단축키</h3>
            <ul className="space-y-1.5">
              {shortcuts.map((s) => (
                <li key={s.keys} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{s.action}</span>
                  <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-xs text-slate-600">
                    {s.keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}

function FeatureList({
  title,
  items,
  numbered,
}: {
  title: string;
  items: { name: string; how: string }[];
  numbered?: boolean;
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold text-slate-500">{title}</h3>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={item.name} className="flex gap-2.5">
            {numbered && (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                {i + 1}
              </span>
            )}
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{item.how}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
