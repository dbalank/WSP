"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  OctagonAlert,
  CircleCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ClipboardCheck,
  ShieldAlert,
  Database,
  Cog,
  Zap,
  TriangleAlert,
  Plus,
  X,
  Lightbulb,
  GitBranch,
} from "lucide-react";
import { useProjectStore } from "@/lib/stores/project-store";
import { PROJECT_TYPES_LIBRARY } from "@/lib/stores/project-store";

// Mapping: component -> derived physical actions
const COMPONENT_TO_ACTIONS: Record<string, string[]> = {
  "Pipeline (transmission)": [
    "Pipeline trenching and installation",
    "Pipe welding and coating",
    "Backfilling and compaction",
  ],
  "Compressor stations": [
    "Foundation excavation",
    "Equipment installation",
    "Commissioning and testing",
  ],
  "Metering stations": [
    "Site preparation",
    "Equipment installation",
  ],
  "River crossings (HDD)": [
    "Horizontal directional drilling",
    "Watercourse crossing",
    "Sediment control measures",
  ],
  "Access roads (temporary)": [
    "Road grading and construction",
    "Aggregate placement",
    "Vegetation clearing for access",
  ],
  "Laydown areas": [
    "Site clearing for staging",
    "Material storage",
  ],
  "Valve sites": [
    "Valve pit excavation",
    "Valve installation",
  ],
  "Pig launcher/receiver stations": [
    "Station construction",
    "Pipeline connection",
  ],
  // Transmission line components
  "Transmission towers / poles": [
    "Tower foundation construction",
    "Tower erection",
    "Concrete pouring",
  ],
  "Conductors and insulators": [
    "Conductor stringing",
    "Tensioning operations",
  ],
  "Substations (terminal)": [
    "Substation foundation work",
    "Transformer installation",
    "Switchgear installation",
  ],
  "Access roads": [
    "Road construction",
    "Culvert installation",
    "Drainage works",
  ],
  "Guyed anchors": [
    "Anchor installation",
    "Guy wire tensioning",
  ],
  "Underground cable sections (if applicable)": [
    "Cable trenching",
    "Cable laying",
    "Backfilling",
  ],
};

// Mapping: action -> derived impact factors
const ACTION_TO_IMPACT_FACTORS: Record<string, string[]> = {
  "Pipeline trenching and installation": ["Soil disturbance", "Vegetation removal", "Habitat fragmentation"],
  "Horizontal directional drilling": ["Groundwater interaction", "Noise generation", "Inadvertent returns risk"],
  "Watercourse crossing": ["Aquatic habitat disturbance", "Sedimentation risk", "Fish passage impact"],
  "Vegetation clearing for access": ["Habitat loss", "Wildlife displacement", "Erosion risk"],
  "Road grading and construction": ["Soil compaction", "Drainage alteration", "Dust generation"],
  "Tower foundation construction": ["Soil disturbance", "Vegetation removal", "Groundwater interaction"],
  "Conductor stringing": ["Bird collision risk", "Visual impact", "Electromagnetic fields"],
  "Substation foundation work": ["Land use change", "Noise during construction", "Visual impact"],
  default: ["General construction disturbance", "Noise and vibration", "Air quality (dust/emissions)"],
};

export default function ProjectAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { project, updateProjectComponents } = useProjectStore();

  const [customAction, setCustomAction] = useState("");

  const selectedTypeConfig = useMemo(() => {
    if (!project?.projectTypeId) return null;
    return PROJECT_TYPES_LIBRARY.find((t) => t.id === project.projectTypeId) || null;
  }, [project?.projectTypeId]);

  // Derive physical actions from confirmed components
  const derivedActions = useMemo(() => {
    if (!project) return [];
    const actionsSet = new Set<string>();
    
    project.components.forEach((component) => {
      const actions = COMPONENT_TO_ACTIONS[component];
      if (actions) {
        actions.forEach((a) => actionsSet.add(a));
      }
    });
    
    // Also include the activities already on the project
    project.physicalActivities.forEach((a) => actionsSet.add(a));
    
    return Array.from(actionsSet);
  }, [project]);

  // Derive impact factors from physical actions
  const derivedImpactFactors = useMemo(() => {
    const factorsSet = new Set<string>();
    
    derivedActions.forEach((action) => {
      const factors = ACTION_TO_IMPACT_FACTORS[action] || ACTION_TO_IMPACT_FACTORS.default;
      factors.forEach((f) => factorsSet.add(f));
    });
    
    return Array.from(factorsSet);
  }, [derivedActions]);

  // Completeness checks (same as gap analysis)
  const completenessChecks = useMemo(() => {
    if (!project) return [];
    return [
      {
        id: "name",
        label: "Project Name",
        value: project.name || "---",
        done: !!project.name,
        category: "identification",
      },
      {
        id: "type",
        label: "Project Type (from Library)",
        value: project.projectType || "---",
        done: !!project.projectTypeId,
        category: "identification",
      },
      {
        id: "proponent",
        label: "Proponent / Applicant",
        value: project.proponent || "---",
        done: !!project.proponent,
        category: "identification",
      },
      {
        id: "location",
        label: "Project Location (coordinates)",
        value: project.location.coordinates
          ? `${project.location.coordinates.lat.toFixed(4)}, ${project.location.coordinates.lng.toFixed(4)}`
          : "---",
        done: !!project.location.coordinates,
        category: "spatial",
      },
      {
        id: "size",
        label: `Project Size (${project.projectSizeUnit || "unit"})`,
        value:
          project.projectSize !== null && project.projectSize > 0
            ? `${project.projectSize} ${project.projectSizeUnit}`
            : "---",
        done: project.projectSize !== null && project.projectSize > 0,
        category: "technical",
      },
      {
        id: "components",
        label: "Project Components confirmed",
        value: project.components.length > 0 ? `${project.components.length} components` : "---",
        done: project.components.length > 0,
        category: "technical",
      },
      {
        id: "activities",
        label: "Physical Activities identified",
        value:
          derivedActions.length > 0
            ? `${derivedActions.length} activities`
            : "---",
        done: derivedActions.length > 0,
        category: "technical",
      },
    ];
  }, [project, derivedActions]);

  const missingFields = completenessChecks.filter((c) => !c.done);
  const completedFields = completenessChecks.filter((c) => c.done);
  const isComplete = missingFields.length === 0;
  const completenessPercent = Math.round(
    (completedFields.length / completenessChecks.length) * 100
  );

  const handleAddCustomAction = useCallback(() => {
    if (customAction.trim() && project) {
      // For now, we just show the action in the UI
      // In production, this would update the store
      setCustomAction("");
    }
  }, [customAction, project]);

  if (!project) return null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardCheck className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Project Analysis
            </h2>
            <p className="text-sm text-muted-foreground">
              Validate completeness, derive physical actions and impact factors from confirmed components
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* STOP / READY Banner */}
          {!isComplete ? (
            <Card className="border-2 border-destructive/40 bg-destructive/5 shadow-wsp">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <OctagonAlert className="h-7 w-7 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-destructive">
                      STOP -- Project Data Incomplete
                    </h3>
                    <p className="mt-1 text-sm text-destructive/80 leading-relaxed">
                      The screening process cannot begin until all required project
                      data is complete. <strong>{missingFields.length}</strong>{" "}
                      required field{missingFields.length > 1 ? "s are" : " is"}{" "}
                      missing. Return to Project Setup to fill in the missing data.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-3 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => router.push(`/project/${projectId}/setup`)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Return to Setup
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-primary/40 bg-primary/5 shadow-wsp">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CircleCheck className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-primary">
                      READY -- All Required Data Present
                    </h3>
                    <p className="mt-1 text-sm text-primary/80 leading-relaxed">
                      All {completenessChecks.length} required fields are complete.
                      Review the derived actions and impact factors below, then proceed
                      to the parallel Legal & Context analysis.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirmed Components */}
          <Card className="border-border bg-card shadow-wsp">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Cog className="h-4 w-4 text-primary" />
                Confirmed Project Components
                <Badge variant="outline" className="ml-auto text-[9px]">
                  {project.components.length} components
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.components.map((component) => (
                  <Badge
                    key={component}
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                  >
                    {component}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Derived Physical Actions */}
          <Card className="border-border bg-card shadow-wsp">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-amber-500" />
                Derived Physical Actions
                <Badge className="ml-auto bg-amber-500/10 text-amber-600 border-amber-500/30 text-[9px]">
                  AI-derived from components
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Based on your confirmed components, the following physical actions
                have been identified. These will be used to assess environmental
                impacts.
              </p>
              <div className="space-y-2">
                {derivedActions.map((action, i) => (
                  <div
                    key={action}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <Checkbox id={`action-${i}`} defaultChecked />
                    <label
                      htmlFor={`action-${i}`}
                      className="text-xs text-foreground cursor-pointer flex-1"
                    >
                      {action}
                    </label>
                  </div>
                ))}
              </div>
              {/* Add custom action */}
              <div className="flex items-center gap-2 mt-3">
                <Input
                  placeholder="Add custom action..."
                  value={customAction}
                  onChange={(e) => setCustomAction(e.target.value)}
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={handleAddCustomAction}
                  disabled={!customAction.trim()}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Derived Impact Factors */}
          <Card className="border-border bg-card shadow-wsp">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TriangleAlert className="h-4 w-4 text-destructive" />
                Derived Impact Factors
                <Badge className="ml-auto bg-destructive/10 text-destructive border-destructive/30 text-[9px]">
                  AI-derived from actions
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Based on the physical actions, these potential environmental impact
                factors have been identified for assessment in the Impact Analysis
                step.
              </p>
              <div className="flex flex-wrap gap-2">
                {derivedImpactFactors.map((factor) => (
                  <Badge
                    key={factor}
                    variant="outline"
                    className="px-2.5 py-1 text-[10px] border-destructive/30 text-destructive"
                  >
                    {factor}
                  </Badge>
                ))}
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground">
                  These impact factors will be crossed with Valued Environmental
                  Components (VECs) identified during Context Analysis to build the
                  Impact Matrix.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Completeness Score */}
          <Card className="border-border bg-card shadow-wsp">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Data Completeness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold text-foreground">
                  {completenessPercent}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {completedFields.length}/{completenessChecks.length} fields
                </span>
              </div>
              <Progress value={completenessPercent} className="h-2.5" />

              <Separator />

              <div className="space-y-2">
                {completenessChecks.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs">
                    {item.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    )}
                    <span
                      className={
                        item.done
                          ? "text-foreground"
                          : "text-destructive font-medium"
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps Info */}
          <Card className="border-border bg-card shadow-wsp">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <GitBranch className="h-4 w-4 text-primary" />
                Next: Parallel Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Upon proceeding, the following analyses will run in parallel:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Legal Categorization</p>
                    <p className="text-[10px] text-muted-foreground">
                      Regulatory threshold evaluation
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Context Analysis</p>
                    <p className="text-[10px] text-muted-foreground">
                      Geospatial overlays and VEC identification
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/project/${projectId}/setup`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Setup
        </Button>
        <Button
          onClick={() => router.push(`/project/${projectId}/legal`)}
          className="gap-2"
          disabled={!isComplete}
        >
          Proceed to Legal Categorization
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
