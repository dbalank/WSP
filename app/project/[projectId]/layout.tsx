"use client";

import { useEffect, useMemo } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Activity,
  ChevronRight,
} from "lucide-react";
import { WizardStepper } from "@/components/layout/wizard-stepper";
import { ProjectStateBadge } from "@/components/shared/status-badge";
import { useProjectStore } from "@/lib/stores/project-store";
import { WizardStep, ScreeningOutcome, ProjectState } from "@/lib/types";

const PATH_TO_STEP: Record<string, WizardStep> = {
  setup: WizardStep.SETUP,
  "project-analysis": WizardStep.PROJECT_ANALYSIS,
  legal: WizardStep.LEGAL,
  context: WizardStep.CONTEXT,
  impact: WizardStep.IMPACT,
  mitigation: WizardStep.MITIGATION,
  historical: WizardStep.HISTORICAL,
  review: WizardStep.REVIEW,
};

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const projectId = params.projectId as string;
  const {
    project,
    loadProject,
    currentStep,
    setCurrentStep,
    thresholdEvaluation,
    contextResult,
    impactMatrix,
    mitigationResult,
    historicalMatches,
    report,
  } = useProjectStore();

  // Derive completed steps based on current step position and available data
  // Steps before the current step are marked as complete
  const STEP_ORDER: WizardStep[] = [
    WizardStep.SETUP,
    WizardStep.PROJECT_ANALYSIS,
    WizardStep.LEGAL,
    WizardStep.CONTEXT,
    WizardStep.IMPACT,
    WizardStep.MITIGATION,
    WizardStep.HISTORICAL,
    WizardStep.REVIEW,
  ];
  
  const completedSteps = useMemo(() => {
    if (!project) return [];
    const completed: WizardStep[] = [];
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    
    // All steps before the current step are complete
    for (let i = 0; i < currentIndex; i++) {
      completed.push(STEP_ORDER[i]);
    }
    
    // Also mark steps as complete based on data availability (for when user navigates back)
    if (thresholdEvaluation) {
      if (!completed.includes(WizardStep.SETUP)) completed.push(WizardStep.SETUP);
      if (!completed.includes(WizardStep.PROJECT_ANALYSIS)) completed.push(WizardStep.PROJECT_ANALYSIS);
    }
    if (contextResult && !completed.includes(WizardStep.LEGAL)) {
      completed.push(WizardStep.LEGAL);
    }
    if (impactMatrix && !completed.includes(WizardStep.CONTEXT)) {
      completed.push(WizardStep.CONTEXT);
    }
    if (mitigationResult && !completed.includes(WizardStep.IMPACT)) {
      completed.push(WizardStep.IMPACT);
    }
    if (historicalMatches && historicalMatches.length > 0 && !completed.includes(WizardStep.MITIGATION)) {
      completed.push(WizardStep.MITIGATION);
    }
    if (report && !completed.includes(WizardStep.HISTORICAL)) {
      completed.push(WizardStep.HISTORICAL);
    }
    if (report && report.status === "final" && !completed.includes(WizardStep.REVIEW)) {
      completed.push(WizardStep.REVIEW);
    }
    
    return completed;
  }, [project, currentStep, thresholdEvaluation, contextResult, impactMatrix, mitigationResult, historicalMatches, report]);

  useEffect(() => {
    if (!project || project.id !== projectId) {
      loadProject(projectId);
    }
  }, [projectId, project, loadProject]);

  // Sync URL path to current step
  useEffect(() => {
    const segments = pathname.split("/");
    const lastSegment = segments[segments.length - 1];
    if (PATH_TO_STEP[lastSegment] && PATH_TO_STEP[lastSegment] !== currentStep) {
      setCurrentStep(PATH_TO_STEP[lastSegment]);
    }
  }, [pathname, currentStep, setCurrentStep]);

  const handleStepClick = (step: WizardStep) => {
    setCurrentStep(step);
    router.push(`/project/${projectId}/${step}`);
  };

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Activity className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading project...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-wsp">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <div className="flex items-center gap-3">
              <Image
                src="/images/wsp-logo.png"
                alt="WSP"
                width={48}
                height={20}
                className="h-5"
                style={{ width: "auto" }}
              />
              <span className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
                {project.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ProjectStateBadge state={project.state} />
            <Badge
              variant="outline"
              className="hidden border-border font-mono text-[10px] text-muted-foreground sm:flex"
            >
              {project.id}
            </Badge>
          </div>
        </div>

        {/* Stepper */}
        <div className="mx-auto max-w-5xl border-t border-border px-6 py-2.5 bg-card">
          <WizardStepper
            currentStep={currentStep}
            screeningOutcome={
              project.screeningOutcome as ScreeningOutcome
            }
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
