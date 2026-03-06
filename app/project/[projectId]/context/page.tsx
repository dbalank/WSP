"use client";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  TreePine,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Zap,
  Eye,
  Layers,
  Globe,
  Navigation,
  FileCheck,
  ShieldCheck,
  GitCompareArrows,
  Map,
} from "lucide-react";
import { SeverityBadge } from "@/components/shared/status-badge";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { AgentStatusTracker } from "@/components/project/agent-status-tracker";
import { DynamicProjectMap } from "@/components/map/dynamic-map";
import type { SensitiveAreaMarker } from "@/components/map/project-map";
import { useProjectStore } from "@/lib/stores/project-store";
import { Severity } from "@/lib/types";
import { useState, useCallback, useEffect, useMemo } from "react";

export default function ContextPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const {
    project,
    contextResult,
    historicalMatches,
    orchestrationStatus,
    runContextAnalysis,
    runHistoricalComparison,
  } = useProjectStore();

  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!contextResult) runContextAnalysis();
    if (historicalMatches.length === 0) runHistoricalComparison();
  }, [contextResult, historicalMatches, runContextAnalysis, runHistoricalComparison]);

  const handleRunAnalysis = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      runContextAnalysis();
      runHistoricalComparison();
      setIsRunning(false);
    }, 2000);
  }, [runContextAnalysis, runHistoricalComparison]);

  // Build sensitive area markers for the map from context results
  const sensitiveAreaMarkers: SensitiveAreaMarker[] = useMemo(() => {
    if (!contextResult) return [];
    return contextResult.sensitiveAreas
      .filter((a) => a.coordinates)
      .map((a) => ({
        id: a.id,
        name: a.name,
        lat: a.coordinates!.lat,
        lng: a.coordinates!.lng,
        severity: a.severity as "critical" | "high" | "moderate" | "low",
      }));
  }, [contextResult]);

  // Determine if there's overlap with sensitive areas (high/critical)
  const hasHighSeverityOverlap = useMemo(() => {
    if (!contextResult) return false;
    return contextResult.sensitiveAreas.some(
      (a) => a.severity === Severity.HIGH || a.severity === Severity.CRITICAL
    );
  }, [contextResult]);

  // Exemption: NO overlap with high/critical sensitive areas
  const isExemptionPath = useMemo(() => {
    if (!contextResult) return false;
    return !hasHighSeverityOverlap;
  }, [contextResult, hasHighSeverityOverlap]);

  if (!project) return null;

  const hasResults = !!contextResult;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Context Analysis
            </h2>
            <p className="text-sm text-muted-foreground">
              WSP geospatial overlay, sensitive area detection, and VEC
              identification
            </p>
          </div>
        </div>
        {!hasResults && !isRunning && (
          <Button onClick={handleRunAnalysis} className="gap-2">
            <Zap className="h-4 w-4" />
            Run Context Analysis
          </Button>
        )}
      </div>

      {/* Agent Status */}
      {isRunning && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <AgentStatusTracker statuses={orchestrationStatus.slice(3, 5)} />
          </CardContent>
        </Card>
      )}

      {hasResults ? (
        <div className="space-y-6">
          {/* Interactive Map with Overlays */}
          <Card className="border-border bg-card shadow-wsp overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Map className="h-4 w-4 text-primary" />
                  Project Map with Spatial Overlays
                </CardTitle>
                <Badge variant="outline" className="text-[9px] text-muted-foreground">
                  {sensitiveAreaMarkers.length} sensitive areas shown
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 pb-4 px-4">
              {project.location.coordinates && (
                <DynamicProjectMap
                  center={project.location.coordinates}
                  zoom={9}
                  marker={project.location.coordinates}
                  bufferRadiusKm={project.bufferDistanceKm}
                  sensitiveAreas={sensitiveAreaMarkers}
                  readonly
                  height="420px"
                />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Column 1: Location + Sensitive Areas + GIS Overlays */}
            <div className="space-y-6 lg:col-span-2">
              {/* Project Location */}
              <Card className="border-border bg-card shadow-wsp">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Navigation className="h-4 w-4 text-primary" />
                    Project Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/50 bg-secondary/50 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Navigation className="h-3 w-3" />
                        Coordinates (Centroid)
                      </div>
                      <p className="text-xs font-mono font-semibold text-foreground">
                        {project.location.coordinates
                          ? `${project.location.coordinates.lat.toFixed(4)}N, ${Math.abs(project.location.coordinates.lng).toFixed(4)}W`
                          : "---"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-secondary/50 p-3">
                      <div className="text-xs text-muted-foreground mb-1">
                        Region
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        {project.location.region}, {project.location.province}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-1.5">
                      Nearby Environmental Features
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {project.location.nearbyFeatures.map((feature) => (
                        <Badge
                          key={feature}
                          variant="outline"
                          className="text-[9px]"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {project.location.indigenousTerritory &&
                    project.location.indigenousTerritory.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground mb-1.5">
                          Indigenous Territories
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {project.location.indigenousTerritory.map(
                            (territory) => (
                              <Badge
                                key={territory}
                                variant="outline"
                                className="text-[9px] border-primary/30 text-primary"
                              >
                                {territory}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>

              {/* Sensitive Areas */}
              <Card className="border-border bg-card shadow-wsp">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    Sensitive Areas Detected
                    <Badge
                      className={`ml-auto text-[9px] ${
                        hasHighSeverityOverlap
                          ? "bg-destructive/15 text-destructive border-destructive/30"
                          : "bg-primary/15 text-primary border-primary/30"
                      }`}
                    >
                      {hasHighSeverityOverlap
                        ? "HIGH/CRITICAL overlap detected"
                        : "No high-severity overlap"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contextResult.sensitiveAreas.map((area) => (
                      <div
                        key={area.id}
                        className="flex items-start justify-between rounded-lg border border-border/50 bg-secondary/50 p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">
                              {area.name}
                            </span>
                            <SeverityBadge
                              severity={area.severity as Severity}
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {area.description}
                          </p>
                          <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span>Type: {area.type}</span>
                            <span>Distance: {area.distance} km</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Geospatial Overlay Analysis */}
              <Card className="border-border bg-card shadow-wsp">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Layers className="h-4 w-4 text-primary" />
                    Geospatial Overlay Analysis
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    GIS data layers intersected with project footprint and buffer
                    zone
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {contextResult.spatialOverlays.map((overlay) => (
                      <div
                        key={overlay.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/50 p-2.5"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              overlay.intersects
                                ? "bg-primary"
                                : "bg-muted-foreground/30"
                            }`}
                          />
                          <span className="text-[11px] font-medium text-foreground truncate">
                            {overlay.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge variant="outline" className="text-[8px]">
                            {overlay.layerType}
                          </Badge>
                          {overlay.intersects ? (
                            <span className="text-[10px] font-semibold text-primary">
                              {overlay.areaOfOverlap} km&sup2;
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              No overlap
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      {
                        contextResult.spatialOverlays.filter((o) => o.intersects)
                          .length
                      }{" "}
                      of {contextResult.spatialOverlays.length} layers intersect
                    </span>
                    <span className="font-mono">
                      Total overlap:{" "}
                      {contextResult.spatialOverlays
                        .reduce((sum, o) => sum + o.areaOfOverlap, 0)
                        .toFixed(1)}{" "}
                      km&sup2;
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Historical Comparison #1: Project Description */}
              {historicalMatches.length > 0 && (
                <Card className="border-border bg-card shadow-wsp">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <GitCompareArrows className="h-4 w-4 text-primary" />
                      Historical Comparison -- Project Description
                      <Badge
                        variant="outline"
                        className="ml-auto text-[9px]"
                      >
                        Phase 1
                      </Badge>
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Comparing project description and context against
                      historical precedents
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {historicalMatches.slice(0, 2).map((match) => (
                        <div
                          key={match.id}
                          className="rounded-lg border border-border/50 bg-secondary/50 p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-foreground">
                              {match.projectName}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px]"
                            >
                              {match.year} -- {(match.similarityScore * 100).toFixed(0)}% match
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            <div className="rounded border border-border/30 bg-background p-2 text-center">
                              <div className="text-muted-foreground">
                                Component Overlap
                              </div>
                              <div className="font-semibold text-foreground mt-0.5">
                                {(
                                  match.structuralComparison.componentOverlap *
                                  100
                                ).toFixed(0)}
                                %
                              </div>
                            </div>
                            <div className="rounded border border-border/30 bg-background p-2 text-center">
                              <div className="text-muted-foreground">
                                Style Consistency
                              </div>
                              <div className="font-semibold text-foreground mt-0.5">
                                {(
                                  match.structuralComparison.styleConsistency *
                                  100
                                ).toFixed(0)}
                                %
                              </div>
                            </div>
                            <div className="rounded border border-border/30 bg-background p-2 text-center">
                              <div className="text-muted-foreground">
                                Length Ratio
                              </div>
                              <div className="font-semibold text-foreground mt-0.5">
                                {match.structuralComparison.lengthRatio.toFixed(
                                  2
                                )}
                                x
                              </div>
                            </div>
                          </div>
                          <p className="mt-2 text-[10px] text-muted-foreground italic">
                            {match.structuralComparison.notes}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Column 2: VECs + Decision */}
            <div className="space-y-6">
              {/* Decision Point */}
              <Card
                className={`shadow-wsp ${
                  hasHighSeverityOverlap
                    ? "border-2 border-warning/40 bg-warning/5"
                    : "border-2 border-primary/40 bg-primary/5"
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <h4 className="text-xs font-bold text-foreground text-center uppercase tracking-wider">
                    Is there overlap with a sensitive area?
                  </h4>
                  <div className="text-center">
                    {hasHighSeverityOverlap ? (
                      <Badge className="bg-warning/15 text-warning border-warning/30 text-sm px-4 py-1">
                        YES -- High/Critical overlap
                      </Badge>
                    ) : (
                      <Badge className="bg-primary/15 text-primary border-primary/30 text-sm px-4 py-1">
                        NO -- No significant overlap
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    {hasHighSeverityOverlap
                      ? "Proceed to Impact Analysis for detailed assessment of impacts and mitigation measures."
                      : "No high or critical severity sensitive areas detected. An exemption report may be generated."}
                  </p>
                </CardContent>
              </Card>

              {/* Exemption path */}
              {isExemptionPath && (
                <Card className="border-2 border-primary/40 bg-primary/5 shadow-wsp">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-primary">
                          Exemption Path Available
                        </h4>
                        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                          No sensitive areas with high or critical severity
                          overlap the project buffer zone.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-2 gap-2 border-primary/30 text-primary hover:bg-primary/10 text-xs h-8"
                          onClick={() =>
                            router.push(`/project/${projectId}/review`)
                          }
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                          Generate Exemption Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* VECs */}
              <Card className="border-border bg-card shadow-wsp">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TreePine className="h-4 w-4 text-primary" />
                    Valued Ecosystem Components
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contextResult.vecs.map((vec) => (
                    <div
                      key={vec.id}
                      className="rounded-lg border border-border/50 bg-secondary/50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">
                          {vec.name}
                        </span>
                        <Badge variant="outline" className="text-[9px]">
                          {vec.category}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                        {vec.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono"
                        >
                          {vec.regulatoryBasis}
                        </Badge>
                        <ConfidenceIndicator value={vec.relevanceScore} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Context Summary */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Eye className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <h4 className="text-xs font-semibold text-primary">
                        Context Summary
                      </h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-foreground">
                        {contextResult.contextSummary}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        !isRunning && (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Globe className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">
                Run the analysis to evaluate geospatial context and identify
                sensitive areas
              </p>
              <Button onClick={handleRunAnalysis} className="mt-4 gap-2">
                <Zap className="h-4 w-4" />
                Run Context Analysis
              </Button>
            </CardContent>
          </Card>
        )
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/project/${projectId}/legal`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Legal Categorization
        </Button>
        {hasResults && (
          <>
            {isExemptionPath && (
              <Badge
                variant="outline"
                className="text-[10px] text-primary border-primary/30"
              >
                Exemption eligible
              </Badge>
            )}
            <Button
              onClick={() => router.push(`/project/${projectId}/impact`)}
              className="gap-2"
            >
              {isExemptionPath
                ? "Continue to Full Screening"
                : "Proceed to Impact Analysis"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
