"use client";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  ArrowLeft,
  Zap,
  Loader2,
  History,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  ExternalLink,
  FileText,
  MapPin,
  Calendar,
  Users,
  Shield,
  Download,
} from "lucide-react";
import { useProjectStore } from "@/lib/stores/project-store";
import { useState, useCallback, useEffect } from "react";

export default function HistoricalPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const {
    project,
    contextResult,
    impactMatrix,
    historicalMatches,
    consistencyReport,
    mitigationResult,
    runContextAnalysis,
    runImpactAnalysis,
    runHistoricalComparison,
    runConsistencyValidation,
    runMitigation,
  } = useProjectStore();

  const [isRunning, setIsRunning] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<typeof historicalMatches[number] | null>(null);

  // Auto-populate preceding data if missing
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
  
  useEffect(() => {
    if (impactMatrix && !mitigationResult) {
      runMitigation();
    }
  }, [impactMatrix, mitigationResult, runMitigation]);

  const handleRunComparison = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      runHistoricalComparison();
      runConsistencyValidation();
      setIsRunning(false);
    }, 2500);
  }, [runHistoricalComparison, runConsistencyValidation]);

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
      <div>
        <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Historical Comparison
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compare with past screening decisions for consistency validation
        </p>
      </div>

      {/* Historical Content */}
      {historicalMatches && historicalMatches.length > 0 ? (
        <div className="space-y-6">
          {/* Consistency Score Card */}
          {consistencyReport && (
            <Card className="border-border bg-card shadow-wsp">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Consistency Validation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Overall Consistency Score
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {Math.round(consistencyReport.overallScore * 100)}%
                  </span>
                </div>
                <Progress
                  value={consistencyReport.overallScore * 100}
                  className="h-2"
                />

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <ComparisonRow
                    label="Impact Ratings"
                    value={consistencyReport.impactRatingsAlignment}
                  />
                  <ComparisonRow
                    label="Mitigation Measures"
                    value={consistencyReport.mitigationAlignment}
                  />
                  <ComparisonRow
                    label="Recommendation"
                    value={consistencyReport.recommendationAlignment}
                  />
                </div>

                {consistencyReport.gaps?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-medium text-foreground">
                        Identified Gaps ({consistencyReport.gaps.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {consistencyReport.gaps.map((gap, i) => (
                        <div
                          key={gap.id || i}
                          className="text-[11px] text-muted-foreground bg-amber-500/10 rounded px-3 py-2"
                        >
                          <span className="font-medium">{gap.section}:</span> {gap.description}
                          {gap.suggestedFix && (
                            <p className="mt-1 text-chart-2">Fix: {gap.suggestedFix}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {consistencyReport.deviations?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <GitCompare className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium text-foreground">
                        Justified Deviations ({consistencyReport.deviations.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {consistencyReport.deviations.map((deviation, i) => (
                        <div
                          key={typeof deviation === 'string' ? i : deviation.id || i}
                          className="text-[11px] text-muted-foreground bg-blue-500/10 rounded px-3 py-2"
                        >
                          {typeof deviation === 'string' ? deviation : deviation.description || deviation.reason || JSON.stringify(deviation)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Historical Matches */}
          <Card className="border-border bg-card shadow-wsp">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Comparable Past Projects ({historicalMatches?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(historicalMatches || []).map((match, i) => {
                const phase1 = match.structuralComparison?.phase1Checklist;
                const phase2 = match.structuralComparison?.phase2Checklist;
                return (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-secondary/20 p-5"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-semibold text-foreground">
                          {match.projectName}
                        </h4>
                        <Badge variant="outline" className="text-[10px]">
                          {match.year}
                        </Badge>
                        <Badge className="text-[10px] bg-muted text-foreground">
                          {match.outcome}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {match.projectType}
                      </p>
                    </div>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5 text-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedMatch(match);
                      }}
                    >
                      <FileText className="h-3 w-3" />
                      View Report
                    </Button>
                  </div>

                  {/* Similarity Bar */}
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-xs text-muted-foreground">Similarity:</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${Math.round(match.similarityScore * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {Math.round(match.similarityScore * 100)}%
                    </span>
                  </div>

                  {/* Phase 1: Project Description Comparison */}
                  <div className="rounded-lg border border-border bg-card p-4 mb-3">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <h5 className="text-xs font-semibold text-primary uppercase tracking-wider">
                        Phase 1: Project Description Comparison
                      </h5>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Components Comparable</span>
                        <span className="font-medium">{phase1?.components_score || 85}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                        <span className="text-muted-foreground">Components Comparable</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Style Consistency</span>
                        <span className="font-medium">{phase1?.style_score || 78}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                        <span className="text-muted-foreground">Style Comparable</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Length Ratio</span>
                        <span className="font-medium text-chart-4">{phase1?.length_score || 67}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 text-chart-4" />
                        <span className="text-muted-foreground">Length Comparable</span>
                      </div>
                      <div />
                      <div className="flex items-center gap-2 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 text-chart-4" />
                        <span className="text-muted-foreground">Gaps Identified</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground italic mt-3 pt-3 border-t border-border">
                      {match.structuralComparison?.notes || "Similar pipeline infrastructure. Same province and overlapping First Nations territories."}
                    </p>
                  </div>

                  {/* Phase 2: Impact & Mitigation Comparison */}
                  <div className="rounded-lg border border-border bg-card p-4 mb-3">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <h5 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
                        Phase 2: Impact & Mitigation Comparison
                      </h5>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Impact Overlap</span>
                        <span className="font-medium">{phase2?.impact_overlap || 72}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                        <span className="text-muted-foreground">Impacts Comparable</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Mitigation Ratio</span>
                        <span className="font-medium">{phase2?.mitigation_ratio || 81}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                        <span className="text-muted-foreground">Mitigations Comparable</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Style Consistency</span>
                        <span className="font-medium">{phase2?.style_consistency || 74}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                        <span className="text-muted-foreground">Style Comparable</span>
                      </div>
                      <div />
                      <div className="flex items-center gap-2 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 text-chart-4" />
                        <span className="text-muted-foreground">Gaps Identified</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground italic mt-3 pt-3 border-t border-border">
                      Impact factor overlap: {phase2?.impact_overlap || 72}%. Mitigation count ratio: 7 vs 9 historical.
                    </p>
                  </div>

                  {/* Decision Criteria Comparison */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <GitCompare className="h-4 w-4 text-muted-foreground" />
                      <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Decision Criteria Comparison
                      </h5>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground">Outcome Match</span>
                      <CheckCircle2 className="h-4 w-4 text-chart-2" />
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-muted-foreground">Criteria Alignment</span>
                      <span className="text-sm font-medium">{Math.round(match.similarityScore * 95)}%</span>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <p className="text-[10px] text-muted-foreground mb-2">Divergences:</p>
                      <p className="text-[11px] text-destructive">
                        {match.projectName} had additional environmental assessment bundled
                      </p>
                      <p className="text-[11px] text-destructive">
                        Different caribou herd populations affected
                      </p>
                    </div>
                  </div>
                </div>
              );
              })}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-border bg-card shadow-wsp">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-sm font-medium text-foreground mb-1">
              No Historical Comparison
            </h3>
            <p className="text-[11px] text-muted-foreground text-center max-w-sm mb-4">
              Run the historical comparison agent to find similar past screening
              decisions and validate consistency.
            </p>
            <Button
              onClick={handleRunComparison}
              disabled={isRunning || !mitigationResult}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding Matches...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Run Historical Comparison
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
          onClick={() => router.push(`/project/${projectId}/mitigation`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Mitigation
        </Button>
        <Button
          onClick={() => router.push(`/project/${projectId}/review`)}
          className="gap-2"
          disabled={!historicalMatches || historicalMatches.length === 0}
        >
          Proceed to Report
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Historical Project Report Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedMatch && (
            <>
              <DialogHeader className="pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl font-bold text-foreground">
                      {selectedMatch.projectName}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Screening Decision Report
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary text-sm px-3 py-1">
                    {selectedMatch.outcome}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Project Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Decision Year</p>
                      <p className="text-sm font-medium">{selectedMatch.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Project Type</p>
                      <p className="text-sm font-medium">{selectedMatch.projectType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Province</p>
                      <p className="text-sm font-medium">British Columbia / Alberta</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Proponent</p>
                      <p className="text-sm font-medium">{selectedMatch.projectName.split(" ")[0]} Corp.</p>
                    </div>
                  </div>
                </div>

                {/* Screening Decision Summary */}
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground">Screening Decision Summary</h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Decision Type</span>
                      <span className="font-medium">{selectedMatch.outcome}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Assessment Duration</span>
                      <span className="font-medium">18 months</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Conditions Imposed</span>
                      <span className="font-medium">37 conditions</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Follow-up Required</span>
                      <span className="font-medium text-chart-4">Yes - Ongoing</span>
                    </div>
                  </div>
                </div>

                {/* Key Environmental Components */}
                <div className="rounded-lg border border-border p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Valued Environmental Components (VECs)</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Caribou Habitat</Badge>
                    <Badge variant="outline">Fish & Fish Habitat</Badge>
                    <Badge variant="outline">Wetlands</Badge>
                    <Badge variant="outline">First Nations Interests</Badge>
                    <Badge variant="outline">Water Quality</Badge>
                    <Badge variant="outline">Air Quality</Badge>
                  </div>
                </div>

                {/* Mitigation Summary */}
                <div className="rounded-lg border border-border p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Key Mitigation Measures</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 shrink-0" />
                      Caribou habitat offsetting program with 5:1 replacement ratio
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 shrink-0" />
                      Fish passage structures at all watercourse crossings
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 shrink-0" />
                      Indigenous monitoring program throughout construction
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 shrink-0" />
                      Seasonal construction windows to protect wildlife
                    </li>
                  </ul>
                </div>

                {/* Relevance to Current Project */}
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <h4 className="text-sm font-semibold text-primary mb-2">Relevance to Current Project</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedMatch.structuralComparison?.notes || 
                      `This project shares ${Math.round(selectedMatch.similarityScore * 100)}% similarity with your current screening. 
                      Key comparable factors include similar infrastructure type, overlapping geographic region, 
                      and comparable environmental sensitivities.`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="outline" className="gap-2" onClick={() => setSelectedMatch(null)}>
                    Close
                  </Button>
                  <Button className="gap-2" disabled>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ComparisonRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-foreground">
        {Math.round(value * 100)}%
      </div>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
