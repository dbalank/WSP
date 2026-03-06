"use client";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Grid3X3,
  ArrowRight,
  ArrowLeft,
  Zap,
  Loader2,
  Info,
} from "lucide-react";
import { useProjectStore } from "@/lib/stores/project-store";
import { Severity } from "@/lib/types";
import { useState, useCallback, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SEVERITY_COLORS: Record<string, string> = {
  [Severity.NONE]: "bg-severity-none/30 text-severity-none",
  [Severity.LOW]: "bg-severity-low/20 text-severity-low",
  [Severity.MODERATE]: "bg-severity-moderate/20 text-severity-moderate",
  [Severity.HIGH]: "bg-severity-high/20 text-severity-high",
  [Severity.CRITICAL]: "bg-severity-critical/25 text-severity-critical",
};

const SEVERITY_BG: Record<string, string> = {
  [Severity.NONE]: "bg-severity-none/10",
  [Severity.LOW]: "bg-severity-low/10",
  [Severity.MODERATE]: "bg-severity-moderate/15",
  [Severity.HIGH]: "bg-severity-high/15",
  [Severity.CRITICAL]: "bg-severity-critical/20",
};

export default function ImpactPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const {
    project,
    impactMatrix,
    contextResult,
    thresholdEvaluation,
    runImpactAnalysis,
    runContextAnalysis,
    runScreeningDecision,
    toggleImpactCell,
  } = useProjectStore();

  const [isRunning, setIsRunning] = useState(false);

  // Auto-populate prerequisite data
  useEffect(() => {
    if (!thresholdEvaluation) runScreeningDecision();
    if (!contextResult) runContextAnalysis();
  }, [thresholdEvaluation, contextResult, runScreeningDecision, runContextAnalysis]);

  const handleRunMatrix = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      runImpactAnalysis();
      setIsRunning(false);
    }, 2000);
  }, [runImpactAnalysis]);

  const getCell = (ifId: string, vecId: string) => {
    return impactMatrix?.cells.find(
      (c) => c.impactFactorId === ifId && c.vecId === vecId
    );
  };

  const severityCounts = impactMatrix?.cells.reduce(
    (acc, cell) => {
      const sev = (cell.userOverride?.severity || cell.severity) as string;
      acc[sev] = (acc[sev] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (!project) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Grid3X3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Impact Analysis
            </h2>
            <p className="text-sm text-muted-foreground">
              Impact Factor x VEC matrix assessment
            </p>
          </div>
        </div>
      </div>

      {isRunning && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-foreground">
              AI agents are processing the impact matrix...
            </span>
          </CardContent>
        </Card>
      )}

      {/* Impact Matrix Content */}
      {impactMatrix ? (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {(
              [
                Severity.CRITICAL,
                Severity.HIGH,
                Severity.MODERATE,
                Severity.LOW,
                Severity.NONE,
              ] as const
            ).map((sev) => (
              <Badge
                key={sev}
                className={`${SEVERITY_COLORS[sev]} border-0 text-[10px] uppercase`}
              >
                {sev}: {severityCounts?.[sev] || 0}
              </Badge>
            ))}
            <Badge
              variant="outline"
              className="text-[10px] text-muted-foreground"
            >
              Total: {impactMatrix.cells.length} interactions
            </Badge>
          </div>

          {/* Matrix Grid */}
          <Card className="border-border bg-card shadow-wsp overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 border-b border-r border-border bg-card p-3 text-left">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Impact Factor / VEC
                        </span>
                      </th>
                      {impactMatrix.vecs.map((vec) => (
                        <th
                          key={vec.id}
                          className="border-b border-border p-2 text-center"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-semibold text-foreground leading-tight max-w-[80px]">
                              {vec.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[8px] font-normal"
                            >
                              {vec.category}
                            </Badge>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {impactMatrix.impactFactors.map((factor) => (
                      <tr key={factor.id}>
                        <td className="sticky left-0 z-10 border-b border-r border-border bg-card p-3">
                          <div>
                            <span className="text-xs font-medium text-foreground">
                              {factor.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge
                                variant="outline"
                                className="text-[8px]"
                              >
                                {factor.phase}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        {impactMatrix.vecs.map((vec) => {
                          const cell = getCell(factor.id, vec.id);
                          if (!cell) return <td key={vec.id} />;
                          const severity = (cell.userOverride?.severity ||
                            cell.severity) as Severity;
                          return (
                            <td
                              key={vec.id}
                              className={`border-b border-border p-1 text-center ${SEVERITY_BG[severity]}`}
                            >
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() =>
                                        toggleImpactCell(
                                          factor.id,
                                          vec.id
                                        )
                                      }
                                      className={`inline-flex h-7 w-full items-center justify-center rounded text-[10px] font-bold uppercase tracking-wider transition-colors hover:ring-1 hover:ring-primary/40 ${SEVERITY_COLORS[severity]} ${severity === Severity.NONE ? "opacity-40" : ""}`}
                                      aria-label={`Toggle ${factor.name} x ${vec.name}: currently ${severity}`}
                                    >
                                      {severity === Severity.NONE
                                        ? "OFF"
                                        : severity
                                            .charAt(0)
                                            .toUpperCase()}
                                      {cell.userOverride &&
                                        severity !== Severity.NONE && (
                                          <span className="ml-0.5 text-[8px]">
                                            *
                                          </span>
                                        )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="max-w-xs bg-popover text-popover-foreground"
                                  >
                                    <div className="space-y-1.5">
                                      <p className="text-xs font-semibold">
                                        {factor.name} x {vec.name}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        {cell.aiReasoning}
                                      </p>
                                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                                        <span>
                                          Likelihood: {cell.likelihood}
                                        </span>
                                        <span>
                                          Duration: {cell.duration}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-primary font-medium">
                                        Click to toggle impact on/off
                                      </p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex items-center gap-4">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              Click cells to toggle impacts on/off (per NV IA screening
              process). Hover for AI reasoning. * = user override. OFF =
              impact disabled.
            </span>
          </div>
        </div>
      ) : (
        !isRunning && (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Grid3X3 className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">
                {contextResult
                  ? "Generate the impact matrix to assess interactions between impact factors and VECs"
                  : "Complete the Context Analysis step first to identify VECs"}
              </p>
              <Button
                onClick={handleRunMatrix}
                disabled={!contextResult}
                className="mt-4 gap-2"
              >
                <Zap className="h-4 w-4" />
                Generate Matrix
              </Button>
            </CardContent>
          </Card>
        )
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/project/${projectId}/context`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Context
        </Button>
        <Button
          onClick={() => router.push(`/project/${projectId}/mitigation`)}
          className="gap-2"
          disabled={!impactMatrix}
        >
          Proceed to Mitigation
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
