"use client";

import { cn } from "@/lib/utils";
import { WIZARD_STEPS, WizardStep, ScreeningOutcome } from "@/lib/types";
import { Check, SkipForward } from "lucide-react";

interface WizardStepperProps {
  currentStep: WizardStep;
  screeningOutcome: ScreeningOutcome;
  completedSteps?: WizardStep[];
  onStepClick: (step: WizardStep) => void;
}

// Define the sequential flow order
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

export function WizardStepper({
  currentStep,
  screeningOutcome,
  completedSteps = [],
  onStepClick,
}: WizardStepperProps) {
  const getStepConfig = (stepId: WizardStep) =>
    WIZARD_STEPS.find((s) => s.id === stepId)!;

  const isStepComplete = (stepId: WizardStep) => completedSteps.includes(stepId);
  const isStepActive = (stepId: WizardStep) => currentStep === stepId;

  return (
    <nav aria-label="Screening progress" className="w-full overflow-x-auto">
      <div className="flex items-center justify-center gap-0 min-w-max px-4 py-2">
        {STEP_ORDER.map((stepId, index) => {
          const step = getStepConfig(stepId);
          const isActive = isStepActive(stepId);
          const isComplete = isStepComplete(stepId);
          const isSkipped =
            screeningOutcome === ScreeningOutcome.EXEMPT && step.skippedWhenExempt;
          const isLast = index === STEP_ORDER.length - 1;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step circle and label */}
              <button
                onClick={() => onStepClick(step.id)}
                disabled={isSkipped}
                className={cn(
                  "group flex flex-col items-center gap-1.5 transition-all",
                  isSkipped && "cursor-not-allowed opacity-40"
                )}
                title={step.description}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                    isActive &&
                      "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                    isComplete && !isActive && "bg-primary text-primary-foreground",
                    !isActive &&
                      !isComplete &&
                      !isSkipped &&
                      "bg-muted text-muted-foreground border border-border",
                    isSkipped && "bg-muted text-muted-foreground"
                  )}
                >
                  {isSkipped ? (
                    <SkipForward className="h-3.5 w-3.5" />
                  ) : isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-[9px] font-medium leading-tight text-center max-w-[65px] whitespace-nowrap",
                    isActive && "text-foreground font-semibold",
                    isComplete && !isActive && "text-foreground",
                    !isActive && !isComplete && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "h-0.5 w-6 mx-1 transition-colors",
                    isComplete ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
