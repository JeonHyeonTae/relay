"use client";

import { FileText, Upload } from "lucide-react";
import { useRef } from "react";

interface FileDropProps {
  fileName: string | null;
  onSelect: (fileName: string) => void;
  accept?: string;
}

/** 데모용 파일 선택 영역. 실제 업로드는 하지 않고 파일 이름만 쓴다. */
export function FileDrop({ fileName, onSelect, accept }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 hover:border-brand-300 hover:bg-brand-50/40"
    >
      {fileName ? (
        <>
          <FileText className="size-6 text-brand-500" />
          <span className="font-medium text-slate-700">{fileName}</span>
        </>
      ) : (
        <>
          <Upload className="size-6" />
          <span>파일을 선택하세요</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file.name);
        }}
      />
    </button>
  );
}
