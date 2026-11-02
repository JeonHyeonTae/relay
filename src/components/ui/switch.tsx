import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 스위치 왼쪽에 보이는 이름 */
  label: ReactNode;
  title?: string;
  className?: string;
}

export function Switch({ checked, onChange, label, title, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      title={title}
      className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-slate-600 hover:bg-slate-100", className)}
    >
      {label}
      <span className={cn("relative h-4 w-7 rounded-full transition-colors", checked ? "bg-brand-600" : "bg-slate-300")}>
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-3",
          )}
        />
      </span>
    </button>
  );
}
