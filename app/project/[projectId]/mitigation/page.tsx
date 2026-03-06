"use client";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  ArrowLeft,
  Zap,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Plus,
  TrendingDown,
} from "lucide-react";
import { SeverityBadge } from "@/components/shared/status-badge";
import { useProjectStore } from "@/lib/stores/project-store";
import { Severity } from "@/lib/types";
import { useState, useCallback, useEffect } from "react";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  avoidance: { label: "Avoidance", color: "bg-primary/15 text-primary" },
  minimisation: { label: "Minimisation", color: "bg-chart-1/15 text-chart-1" },
  rehabilitation: {
    label: "Rehabilitation",
    color: "bg-chart-2/15 text-chart-2",
  },
  offset: { label: "Offset", color: "bg-chart-5/15 text-chart-5" },
};

export default function MitigationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const {
    project,
    contextResult,
    impactMatrix,
    mitigationResult,
    runMitigation,
    runContextAnalysis,
    runImpactAnalysis,
  } = useProjectStore();

  const [isRunning, setIsRunning] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMeasure, setNewMeasure] = useState({
    title: "",
    description: "",
    type: "minimisation",
    effectiveness: "moderate",
    residualImpact: "moderate",
    targetVEC: "",
    impactFactor: "",
    source: "",
  });

  // Auto-populate context and impact matrix if missing
  useEffect(() => {
    if (!contextResult) {
      runContextAnalysis();
    }
  }, [contextResult, runContextAnalysis]);
  
  useEffect(() => {
    if (contextResult && !impactMatrix) {
      runImpactAnalysis();
    }
  }, [contextResult, impactMatrix, runImpactAnalysis]);

  const handleRunMitigation = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      runMitigation();
      setIsRunning(false);
    }, 2500);
  }, [runMitigation]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Mitigation Measures
            </h2>
            <p className="text-sm text-muted-foreground">
              AI-recommended mitigation measures and residual impact assessment
            </p>
          </div>
        </div>
      </div>

      {/* Mitigation Content */}
      {mitigationResult ? (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border bg-card shadow-wsp">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-primary">
                  {mitigationResult.measures.length}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Total Measures
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card shadow-wsp">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-chart-2">
                  {mitigationResult.measures.filter(
                    (m) => m.effectiveness === "high"
                  ).length}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  High Effectiveness
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card shadow-wsp">
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-foreground">
                  {Math.round(
                    (mitigationResult.residualImpacts.filter(
                      (r) =>
                        r.residualSeverity === Severity.LOW ||
                        r.residualSeverity === Severity.NONE
                    ).length /
                      mitigationResult.residualImpacts.length) *
                      100
                  )}
                  %
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Impacts Mitigated
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card shadow-wsp">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-5 w-5 text-chart-2" />
                  <span className="text-lg font-bold text-chart-2">
                    Effective
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Overall Rating
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Measures List */}
          <div className="space-y-4">
            {mitigationResult.measures.map((measure, i) => {
              const typeConfig = TYPE_LABELS[measure.type] || {
                label: measure.type,
                color: "bg-muted text-muted-foreground",
              };
              const residualValue = measure.residualImpact || "moderate";
              return (
                <Card key={i} className="border-border bg-card shadow-wsp">
                  <CardContent className="pt-5 pb-5">
                    {/* Title + Type Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {measure.title || measure.description.split('.')[0]}
                      </h3>
                      <Badge className={`${typeConfig.color} text-[10px] font-medium border-0`}>
                        {typeConfig.label}
                      </Badge>
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-4">
                      {measure.description}
                    </p>
                    
                    {/* For: Impact Factor x VEC */}
                    <p className="text-sm mb-3">
                      <span className="text-muted-foreground">For: </span>
                      <span className="text-foreground font-medium">{measure.impactFactor || "General Construction"}</span>
                      <span className="text-muted-foreground"> x </span>
                      <span className="text-foreground font-medium">{measure.targetVEC}</span>
                    </p>
                    
                    {/* Effectiveness + Residual */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Effectiveness:</span>
                        <Badge className={`text-[10px] font-medium border-0 uppercase ${
                          measure.effectiveness === "high" 
                            ? "bg-chart-2/15 text-chart-2" 
                            : measure.effectiveness === "moderate"
                            ? "bg-chart-4/15 text-chart-4"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {measure.effectiveness || "HIGH"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Residual:</span>
                        <Badge variant="outline" className={`text-[10px] font-medium uppercase ${
                          residualValue === "low" || residualValue === "none"
                            ? "text-chart-2 border-chart-2/40"
                            : residualValue === "moderate"
                            ? "text-chart-4 border-chart-4/40"
                            : "text-primary border-primary/40"
                        }`}>
                          {residualValue}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Source */}
                    <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground mt-1">
                      Source: {measure.source || "Best Practice Guidelines"}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add Custom Measure Button */}
            <Button 
              variant="outline" 
              className="w-full gap-2 text-sm h-11 rounded-xl"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Custom Mitigation Measure
            </Button>
          </div>
        </div>
      ) : (
        <Card className="border-border bg-card shadow-wsp">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-sm font-medium text-foreground mb-1">
              Mitigation Not Generated
            </h3>
            <p className="text-[11px] text-muted-foreground text-center max-w-sm mb-4">
              Run the AI mitigation agent to generate recommended measures based
              on the impact matrix.
            </p>
            <Button
              onClick={handleRunMitigation}
              disabled={isRunning || !impactMatrix}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Measures...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Generate Mitigation Measures
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/project/${projectId}/impact`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Impact Analysis
        </Button>
        <Button
          onClick={() => router.push(`/project/${projectId}/historical`)}
          className="gap-2"
          disabled={!mitigationResult}
        >
          Proceed to Historical
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Add Custom Measure Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Custom Mitigation Measure</DialogTitle>
            <DialogDescription>
              Add a custom mitigation measure to the project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Noise Barrier Installation"
                value={newMeasure.title}
                onChange={(e) => setNewMeasure({ ...newMeasure, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the mitigation measure..."
                value={newMeasure.description}
                onChange={(e) => setNewMeasure({ ...newMeasure, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={newMeasure.type}
                  onValueChange={(value) => setNewMeasure({ ...newMeasure, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avoidance">Avoidance</SelectItem>
                    <SelectItem value="minimisation">Minimisation</SelectItem>
                    <SelectItem value="rehabilitation">Rehabilitation</SelectItem>
                    <SelectItem value="offset">Offset</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Effectiveness</Label>
                <Select
                  value={newMeasure.effectiveness}
                  onValueChange={(value) => setNewMeasure({ ...newMeasure, effectiveness: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="targetVEC">Target VEC</Label>
                <Input
                  id="targetVEC"
                  placeholder="e.g., Boreal Caribou"
                  value={newMeasure.targetVEC}
                  onChange={(e) => setNewMeasure({ ...newMeasure, targetVEC: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="impactFactor">Impact Factor</Label>
                <Input
                  id="impactFactor"
                  placeholder="e.g., Noise Pollution"
                  value={newMeasure.impactFactor}
                  onChange={(e) => setNewMeasure({ ...newMeasure, impactFactor: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder="e.g., Best Practice Guidelines"
                value={newMeasure.source}
                onChange={(e) => setNewMeasure({ ...newMeasure, source: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Add measure to store (would need to add this function to store)
                setIsAddDialogOpen(false);
                setNewMeasure({
                  title: "",
                  description: "",
                  type: "minimisation",
                  effectiveness: "moderate",
                  residualImpact: "moderate",
                  targetVEC: "",
                  impactFactor: "",
                  source: "",
                });
              }}
              disabled={!newMeasure.title || !newMeasure.description}
            >
              Add Measure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
