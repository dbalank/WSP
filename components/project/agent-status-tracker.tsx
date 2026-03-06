"use client";

import { cn } from "@/lib/utils";
import { AgentPhase } from "@/lib/types";
import type { AgentStatus } from "@/lib/types";
import { Check, Loader2, AlertCircle, SkipForward, Circle } from "lucide-react";

interface AgentStatusTrackerProps {
  statuses: AgentStatus[];
}

const phaseIcon: Record<string, React.ReactNode> = {
  [AgentPhase.IDLE]: <Circle className="h-3.5 w-3.5 text-muted-foreground" />,
  [AgentPhase.RUNNING]: (
    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
  ),
  [AgentPhase.COMPLETE]: <Check className="h-3.5 w-3.5 text-success" />,
  [AgentPhase.ERROR]: (
    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
  ),
  [AgentPhase.SKIPPED]: (
    <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />
  ),
};

export function AgentStatusTracker({ statuses }: AgentStatusTrackerProps) {
  return (
    <div className="space-y-1">
      {statuses.map((status, i) => (
        <div
          key={status.executorName}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            status.phase === AgentPhase.RUNNING && "bg-primary/5",
            status.phase === AgentPhase.COMPLETE && "opacity-70"
          )}
        >
          {/* Connector line */}
          <div className="relative flex flex-col items-center">
            {phaseIcon[status.phase]}
            {i < statuses.length - 1 && (
              <div
                className={cn(
                  "absolute top-4 h-4 w-px",
                  status.phase === AgentPhase.COMPLETE
                    ? "bg-success/40"
                    : "bg-border"
                )}
              />
            )}
          </div>

          <div className="flex flex-1 items-center justify-between">
            <span
              className={cn(
                "text-xs font-medium",
                status.phase === AgentPhase.RUNNING && "text-primary",
                status.phase === AgentPhase.COMPLETE && "text-muted-foreground",
                status.phase === AgentPhase.IDLE && "text-muted-foreground"
              )}
            >
              {status.displayName}
            </span>
            {status.phase === AgentPhase.RUNNING && (
              <span className="font-mono text-[10px] text-primary">
                {status.progress}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
