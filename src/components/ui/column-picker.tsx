"use client";

import { Columns3 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./button";

export interface PickableColumn<K extends string> {
  key: K;
  label: string;
  /** 칼럼 이름 오른쪽에 붙는 표시 (예: 먼데이 점) */
  hint?: ReactNode;
}

/** 보일 칼럼 목록을 브라우저에 기억해 둔다 (저장소를 못 쓰면 기본값) */
export function useStoredColumns<K extends string>(storageKey: string, all: readonly K[], defaults: K[]) {
  const [shown, setShown] = useState<K[]>(defaults);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (Array.isArray(saved)) setShown(saved.filter((k): k is K => all.includes(k)));
    } catch {}
    // 저장된 값은 처음 한 번만 읽는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const toggle = (key: K) => {
    const next = shown.includes(key) ? shown.filter((k) => k !== key) : [...shown, key];
    setShown(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  };

  return [shown, toggle] as const;
}

interface ColumnPickerProps<K extends string> {
  columns: PickableColumn<K>[];
  shown: K[];
  onToggle: (key: K) => void;
  /** 메뉴 아래쪽 설명 */
  legend?: ReactNode;
}

/** 보일 칼럼 고르기. 먼데이 보드마다 칼럼이 달라 필요한 것만 켠다 */
export function ColumnPicker<K extends string>({ columns, shown, onToggle, legend }: ColumnPickerProps<K>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 바깥을 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Columns3 className="size-3.5" />
        칼럼
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <p className="px-2 pt-1 pb-2 text-xs text-slate-500">보일 칼럼을 골라요</p>
          {columns.map((c) => (
            <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
              <input type="checkbox" checked={shown.includes(c.key)} onChange={() => onToggle(c.key)} className="size-4" />
              <span className="flex-1">{c.label}</span>
              {c.hint}
            </label>
          ))}
          {legend && <div className="mt-1 border-t border-slate-100 px-2 pt-2 text-xs text-slate-400">{legend}</div>}
        </div>
      )}
    </div>
  );
}
