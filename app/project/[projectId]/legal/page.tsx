"use client";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Scale,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Loader2,
  Zap,
  FileCheck,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { AgentStatusTracker } from "@/components/project/agent-status-tracker";
import { useProjectStore } from "@/lib/stores/project-store";
import { ScreeningOutcome } from "@/lib/types";
import { useState, useCallback, useEffect } from "react";

export default function LegalPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const {
    project,
    thresholdEvaluation,
    orchestrationStatus,
    runScreeningDecision,
  } = useProjectStore();

  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!thresholdEvaluation) runScreeningDecision();
  }, [thresholdEvaluation, runScreeningDecision]);

  const handleRunAnalysis = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      runScreeningDecision();
      setIsRunning(false);
    }, 2000);
  }, [runScreeningDecision]);

  if (!project) return null;

  const hasResults = !!thresholdEvaluation;
  const isAboveThreshold =
    hasResults &&
    thresholdEvaluation.overallOutcome === ScreeningOutcome.SCREENING_REQUIRED;
  const isBelowThreshold = hasResults && !isAboveThreshold;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Scale className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Legal Categorization
            </h2>
            <p className="text-sm text-muted-foreground">
              Compare project attributes against regulatory thresholds from the
              Legal Library
            </p>
          </div>
        </div>
        {!hasResults && !isRunning && (
          <Button onClick={handleRunAnalysis} className="gap-2">
            <Zap className="h-4 w-4" />
            Run Threshold Check
          </Button>
        )}
      </div>

      {/* Agent Status */}
      {isRunning && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <AgentStatusTracker statuses={orchestrationStatus.slice(0, 3)} />
          </CardContent>
        </Card>
      )}

      {hasResults ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main: Threshold Results */}
          <div className="space-y-6 lg:col-span-2">
            {/* Outcome Banner */}
            {isAboveThreshold ? (
              <Card className="border-2 border-warning/40 bg-warning/5 shadow-wsp">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-warning/10">
                      <AlertTriangle className="h-7 w-7 text-warning" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-warning">
                        ABOVE THRESHOLDS -- Full Screening Required
                      </h3>
                      <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
                        The project triggers one or more regulatory thresholds.
                        A full environmental impact screening is required. Proceed
                        to Context Analysis for geospatial overlay assessment.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-primary/40 bg-primary/5 shadow-wsp">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <ShieldCheck className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-primary">
                        BELOW THRESHOLDS -- Exemption Available
                      </h3>
                      <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
                        The project does not trigger any regulatory thresholds.
                        An Exemption Report can be generated, or you may continue
                        to Context Analysis for additional due diligence.
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <Button
                          variant="outline"
                          className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() =>
                            router.push(`/project/${projectId}/review`)
                          }
                        >
                          <FileCheck className="h-4 w-4" />
                          Generate Exemption Report
                        </Button>
                        <span className="text-[10px] text-muted-foreground">
                          or continue to Context Analysis below
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Regulatory References */}
            <Card className="border-border bg-card shadow-wsp">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Regulatory Framework
                  <Badge variant="outline" className="ml-auto text-[9px]">
                    Legal Library
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {thresholdEvaluation.regulatoryReferences.map((ref) => (
                    <div
                      key={ref.id}
                      className="rounded-lg border border-border/50 bg-secondary/50 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {ref.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono"
                        >
                          {ref.section}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {ref.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Threshold Triggers */}
            <Card className="border-border bg-card shadow-wsp">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-primary" />
                  Threshold Triggers
                  <Badge
                    className={`ml-auto text-[9px] ${
                      isAboveThreshold
                        ? "bg-warning/15 text-warning border-warning/30"
                        : "bg-primary/15 text-primary border-primary/30"
                    }`}
                  >
                    {thresholdEvaluation.triggers.filter((t) => t.triggered).length}{" "}
                    of {thresholdEvaluation.triggers.length} triggered
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {thresholdEvaluation.triggers.map((trigger) => (
                    <div
                      key={trigger.id}
                      className={`rounded-lg border p-3 ${
                        trigger.triggered
                          ? "border-warning/20 bg-warning/5"
                          : "border-primary/20 bg-primary/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {trigger.triggered ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          )}
                          <span className="text-xs font-semibold text-foreground">
                            {trigger.name}
                          </span>
                        </div>
                        <ConfidenceIndicator value={trigger.confidence} />
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                        {trigger.reasoning}
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-1.5 text-[9px] font-mono"
                      >
                        {trigger.regulatoryRef}
                      </Badge>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="rounded-lg bg-accent/30 p-3">
                  <p className="text-xs text-foreground leading-relaxed">
                    <strong>AI Reasoning:</strong>{" "}
                    {thresholdEvaluation.reasoning}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Project Summary + Next */}
          <div className="space-y-6">
            {/* Overall Outcome */}
            <Card
              className={`shadow-wsp ${
                isAboveThreshold
                  ? "border-2 border-warning/40 bg-warning/5"
                  : "border-2 border-primary/40 bg-primary/5"
              }`}
            >
              <CardContent className="p-4 text-center space-y-3">
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                    isAboveThreshold ? "bg-warning/10" : "bg-primary/10"
                  }`}
                >
                  {isAboveThreshold ? (
                    <AlertTriangle className="h-8 w-8 text-warning" />
                  ) : (
                    <ShieldCheck className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <h3
                    className={`text-sm font-bold ${
                      isAboveThreshold ? "text-warning" : "text-primary"
                    }`}
                  >
                    {isAboveThreshold ? "ABOVE" : "BELOW"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isAboveThreshold
                      ? "Full screening required"
                      : "Eligible for exemption"}
                  </p>
                </div>

                <Separator />

                <div className="text-left space-y-2">
                  <InfoRow
                    label="Triggers fired"
                    value={`${thresholdEvaluation.triggers.filter((t) => t.triggered).length} / ${thresholdEvaluation.triggers.length}`}
                  />
                  <InfoRow label="Project Type" value={project.projectType} />
                  <InfoRow
                    label="Size"
                    value={`${project.projectSize} ${project.projectSizeUnit}`}
                  />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      ) : (
        !isRunning && (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Scale className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">
                Run the legal threshold check to evaluate regulatory triggers
              </p>
              <Button onClick={handleRunAnalysis} className="mt-4 gap-2">
                <Zap className="h-4 w-4" />
                Run Threshold Check
              </Button>
            </CardContent>
          </Card>
        )
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/project/${projectId}/project-analysis`)
          }
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project Analysis
        </Button>
        <Button
          onClick={() =>
            router.push(`/project/${projectId}/context`)
          }
          className="gap-2"
          disabled={!hasResults}
        >
          Proceed to Context Analysis
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
