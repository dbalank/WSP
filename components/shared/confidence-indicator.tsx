"use client";

import { cn } from "@/lib/utils";

interface ConfidenceIndicatorProps {
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ConfidenceIndicator({
  value,
  showLabel = true,
  size = "md",
}: ConfidenceIndicatorProps) {
  const percentage = Math.round(value * 100);
  const color =
    percentage >= 90
      ? "text-wsp-green"
      : percentage >= 70
        ? "text-wsp-blue"
        : percentage >= 50
          ? "text-wsp-orange"
          : "text-destructive";

  const barColor =
    percentage >= 90
      ? "bg-wsp-green"
      : percentage >= 70
        ? "bg-wsp-blue"
        : percentage >= 50
          ? "bg-wsp-orange"
          : "bg-destructive";

  return (
    <div className={cn("flex items-center gap-2", size === "sm" ? "gap-1.5" : "gap-2")}>
      <div
        className={cn(
          "overflow-hidden rounded-full bg-muted",
          size === "sm" ? "h-1 w-12" : "h-1.5 w-16"
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn("font-mono text-xs font-semibold", color)}>
          {percentage}%
        </span>
      )}
    </div>
  );
}
