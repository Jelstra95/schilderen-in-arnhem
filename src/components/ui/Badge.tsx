import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "available" | "full" | "pending" | "confirmed" | "cancelled";

const tones: Record<Tone, string> = {
  neutral: "bg-mist text-muted",
  available: "bg-clay/10 text-clay-dark",
  full: "bg-ink/5 text-muted",
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-ink/5 text-muted line-through",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
