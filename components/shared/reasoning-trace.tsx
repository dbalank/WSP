"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReasoningTraceProps {
  reasoning: string;
  label?: string;
  compact?: boolean;
}

export function ReasoningTrace({
  reasoning,
  label = "AI Reasoning",
  compact = false,
}: ReasoningTraceProps) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <button
        onClick={() => setExpanded(!expanded)}
        className="group flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        <Brain className="h-3 w-3" />
        <span>{label}</span>
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        {expanded && (
          <span className="mt-1 block text-left text-xs leading-relaxed text-muted-foreground">
            {reasoning}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="rounded-md border border-border bg-muted/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
          expanded && "border-b border-border"
        )}
      >
        <span className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-primary" />
          {label}
        </span>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>
      {expanded && (
        <div className="px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          {reasoning}
        </div>
      )}
    </div>
  );
}
