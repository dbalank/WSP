"use client";

import { cn } from "@/lib/utils";
import { ProjectState, Severity, AgentPhase } from "@/lib/types";

const stateStyles: Record<string, string> = {
  [ProjectState.DRAFT]: "bg-wsp-grey-100 text-wsp-grey-700",
  [ProjectState.READY_FOR_SCREENING]: "bg-wsp-blue/10 text-wsp-blue",
  [ProjectState.EXEMPT]: "bg-wsp-green/10 text-wsp-green",
  [ProjectState.SCREENING_REQUIRED]: "bg-wsp-orange/10 text-wsp-orange",
  [ProjectState.ANALYSIS_COMPLETE]: "bg-primary/10 text-primary",
  [ProjectState.UNDER_REVIEW]: "bg-wsp-purple/10 text-wsp-purple",
  [ProjectState.FINALISED]: "bg-wsp-green/10 text-wsp-green",
};

const stateLabels: Record<string, string> = {
  [ProjectState.DRAFT]: "Draft",
  [ProjectState.READY_FOR_SCREENING]: "Ready for Screening",
  [ProjectState.EXEMPT]: "Exempt",
  [ProjectState.SCREENING_REQUIRED]: "Screening Required",
  [ProjectState.ANALYSIS_COMPLETE]: "Analysis Complete",
  [ProjectState.UNDER_REVIEW]: "Under Review",
  [ProjectState.FINALISED]: "Finalised",
};

export function ProjectStateBadge({ state }: { state: ProjectState }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
        stateStyles[state] || "bg-muted text-muted-foreground"
      )}
    >
      {stateLabels[state] || state}
    </span>
  );
}

const severityStyles: Record<string, string> = {
  [Severity.NONE]: "bg-severity-none/20 text-severity-none",
  [Severity.LOW]: "bg-severity-low/15 text-severity-low",
  [Severity.MODERATE]: "bg-severity-moderate/15 text-severity-moderate",
  [Severity.HIGH]: "bg-severity-high/15 text-severity-high",
  [Severity.CRITICAL]: "bg-severity-critical/15 text-severity-critical",
};

export function SeverityBadge({ severity }: { severity: Severity | string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        severityStyles[severity] || "bg-muted text-muted-foreground"
      )}
    >
      {severity}
    </span>
  );
}

const phaseStyles: Record<string, string> = {
  [AgentPhase.IDLE]: "bg-muted text-muted-foreground",
  [AgentPhase.RUNNING]: "bg-primary/15 text-primary animate-pulse",
  [AgentPhase.COMPLETE]: "bg-success/15 text-success",
  [AgentPhase.ERROR]: "bg-destructive/15 text-destructive",
  [AgentPhase.SKIPPED]: "bg-muted text-muted-foreground",
};

export function AgentPhaseBadge({ phase }: { phase: AgentPhase }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        phaseStyles[phase]
      )}
    >
      {phase === AgentPhase.RUNNING && (
        <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
      )}
      {phase === AgentPhase.COMPLETE && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success" />
      )}
      {phase}
    </span>
  );
}
