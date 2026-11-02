"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "./badge";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** 회의에서 결정되지 않은 안을 표시할 때 사용 (예: "안 A") */
  tag?: string;
  footer?: ReactNode;
  /** 내용이 많은 창(일괄 보내기, 문서 초안 등)은 넓게 */
  size?: "md" | "lg";
  children: ReactNode;
}

export function Modal({ open, onClose, title, description, tag, footer, size = "md", children }: ModalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  // 열리면 첫 입력 칸에 바로 커서를 둔다
  useEffect(() => {
    if (open) bodyRef.current?.querySelector<HTMLElement>("input:not([type=file]), textarea, select")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={onClose}>
      <div
        className={cn("w-full rounded-2xl bg-white shadow-xl", size === "lg" ? "max-w-2xl" : "max-w-lg")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">{title}</h2>
              {tag && <Badge className="bg-amber-100 text-amber-800">{tag}</Badge>}
            </div>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
            aria-label="닫기"
          >
            <X className="size-4" />
          </button>
        </div>
        <div ref={bodyRef} className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
