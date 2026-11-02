import { cn } from "@/lib/cn";

const COLORS = ["bg-brand-100 text-brand-700", "bg-emerald-100 text-emerald-700", "bg-rose-100 text-rose-700", "bg-amber-100 text-amber-800"];

export function Avatar({ name, className }: { name: string; className?: string }) {
  const color = COLORS[name.charCodeAt(0) % COLORS.length];
  return (
    <span
      className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold", color, className)}
    >
      {name.slice(0, 1)}
    </span>
  );
}
