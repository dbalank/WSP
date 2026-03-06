"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileText,
  Pencil,
  RotateCcw,
  Zap,
  Plus,
  X,
  OctagonAlert,
  CircleCheck,
  Ruler,
  MapPin,
  Building2,
  Boxes,
} from "lucide-react";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { SourcePreviewModal } from "@/components/shared/source-preview-modal";
import { DynamicProjectMap } from "@/components/map/dynamic-map";
import { useProjectStore } from "@/lib/stores/project-store";
import { PROJECT_TYPES_LIBRARY } from "@/lib/stores/project-store";
import { ProjectState } from "@/lib/types";

export default function SetupPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const {
    project,
    setProject,
    advanceProjectState,
    updateProjectType,
    updateProjectSize,
    updateProjectComponents,
    updateProjectLocation,
    recalcCompleteness,
    updateExtractedField,
  } = useProjectStore();

  const [intakeText, setIntakeText] = useState(project?.rawIntakeText || "");
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(
    (project?.extractedFields?.length ?? 0) > 0
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sourceHighlight, setSourceHighlight] = useState<string | null>(null);
  const [customComponent, setCustomComponent] = useState("");
  const [latInput, setLatInput] = useState(
    project?.location.coordinates?.lat.toString() || ""
  );
  const [lngInput, setLngInput] = useState(
    project?.location.coordinates?.lng.toString() || ""
  );
  const [contextTriggered, setContextTriggered] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [editingFieldValue, setEditingFieldValue] = useState("");
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<{
    type: "regulation" | "library" | "historical" | "ai_generated" | "document";
    reference: string;
    excerpt: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected project type config
  const selectedTypeConfig = useMemo(() => {
    if (!project?.projectTypeId) return null;
    return PROJECT_TYPES_LIBRARY.find((t) => t.id === project.projectTypeId) || null;
  }, [project?.projectTypeId]);

  // Completeness checks for gap analysis
  const completenessChecks = useMemo(() => {
    if (!project) return [];
    return [
      { id: "name", label: "Project Name", done: !!project.name, required: true },
      { id: "type", label: "Project Type (from Library)", done: !!project.projectTypeId, required: true },
      { id: "proponent", label: "Proponent / Applicant", done: !!project.proponent, required: true },
      { id: "location", label: "Project Location (coordinates)", done: !!project.location.coordinates, required: true },
      { id: "size", label: `Project Size (${project.projectSizeUnit || "unit"})`, done: project.projectSize !== null && project.projectSize > 0, required: true },
      { id: "components", label: "Project Components confirmed", done: project.components.length > 0, required: true },
      { id: "activities", label: "Physical Activities identified", done: project.physicalActivities.length > 0, required: true },
    ];
  }, [project]);

  const missingFields = completenessChecks.filter((c) => c.required && !c.done);
  const isComplete = missingFields.length === 0;

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setUploadedFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) setIntakeText(text);
        };
        reader.readAsText(file);
      }
    },
    []
  );

  const handleSourceClick = useCallback((source: string) => {
    setSourceHighlight(source);
    setTimeout(() => setSourceHighlight(null), 2500);
    // Open source preview modal
    setSelectedSource({
      type: "document",
      reference: source,
      excerpt: `Extracted from ${source} section of the uploaded project description document.`,
    });
    setSourceModalOpen(true);
  }, []);

  const handleExtract = useCallback(() => {
    if (!project) return;
    setIsExtracting(true);
    setTimeout(() => {
      setProject({
        ...project,
        rawIntakeText: intakeText || project.rawIntakeText,
        updatedAt: new Date().toISOString(),
      });
      recalcCompleteness();
      setIsExtracting(false);
      setHasExtracted(true);
    }, 2000);
  }, [project, intakeText, setProject, recalcCompleteness]);

  const handleTypeChange = useCallback(
    (typeId: string) => {
      updateProjectType(typeId);
    },
    [updateProjectType]
  );

  const handleSizeChange = useCallback(
    (value: string) => {
      const num = value === "" ? null : parseFloat(value);
      updateProjectSize(num);
    },
    [updateProjectSize]
  );

  const handleToggleComponent = useCallback(
    (component: string, checked: boolean) => {
      if (!project) return;
      const updated = checked
        ? [...project.components, component]
        : project.components.filter((c) => c !== component);
      updateProjectComponents(updated);
    },
    [project, updateProjectComponents]
  );

  const handleAddCustomComponent = useCallback(() => {
    if (!project || !customComponent.trim()) return;
    updateProjectComponents([...project.components, customComponent.trim()]);
    setCustomComponent("");
  }, [project, customComponent, updateProjectComponents]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setLatInput(lat.toString());
      setLngInput(lng.toString());
      updateProjectLocation(lat, lng);
      if (!contextTriggered) {
        setContextTriggered(true);
      }
    },
    [updateProjectLocation, contextTriggered]
  );

  const handleManualLocationSubmit = useCallback(() => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      updateProjectLocation(lat, lng);
      if (!contextTriggered) {
        setContextTriggered(true);
      }
    }
  }, [latInput, lngInput, updateProjectLocation, contextTriggered]);

  const handleRemoveComponent = useCallback(
    (component: string) => {
      if (!project) return;
      updateProjectComponents(project.components.filter((c) => c !== component));
    },
    [project, updateProjectComponents]
  );

  const handleContinue = () => {
    if (project) {
      advanceProjectState(ProjectState.READY_FOR_SCREENING);
    }
    router.push(`/project/${projectId}/project-analysis`);
  };

  if (!project) return null;

  // Standard components from selected type that aren't in current project components
  const availableStandardComponents =
    selectedTypeConfig?.standardComponents.filter(
      (c) => !project.components.includes(c)
    ) || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Project Setup & Intake
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure project type, size, and components from the Project Types
              Library, then extract data from documents
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Configuration + Intake (3 cols) */}
        <div className="space-y-6 lg:col-span-3">
          {/* Project Type Selection */}
          <Card className="border-border bg-card shadow-wsp">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-primary" />
                Project Type
                <Badge variant="outline" className="ml-auto text-[9px]">
                  Project Types Library
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={project.projectTypeId || ""}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project type from the library..." />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES_LIBRARY.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <span>{type.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ISIC {type.isicCode}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTypeConfig && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border/50 bg-secondary/50 p-2.5">
                    <div className="text-[10px] text-muted-foreground">
                      ISIC Code
                    </div>
                    <div className="text-xs font-semibold font-mono text-foreground">
                      {selectedTypeConfig.isicCode}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-secondary/50 p-2.5">
                    <div className="text-[10px] text-muted-foreground">
                      Buffer Distance
                    </div>
                    <div className="text-xs font-semibold text-foreground">
                      {selectedTypeConfig.bufferDistanceKm} km
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-secondary/50 p-2.5">
                    <div className="text-[10px] text-muted-foreground">
                      Legal Threshold
                    </div>
                    <div className="text-xs font-semibold text-foreground">
                      {selectedTypeConfig.legalThresholdValue}{" "}
                      {selectedTypeConfig.legalThresholdUnit}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Where is your project? -- Interactive Map */}
          <Card className="border-border bg-card shadow-wsp">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                Where is your project?
                {contextTriggered && (
                  <Badge className="ml-auto bg-primary/10 text-primary text-[9px] border-primary/30">
                    Context analysis triggered
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[11px] text-muted-foreground">
                Click on the map to set the project location, or enter coordinates manually below.
                Setting the location triggers the context analysis engine in the background.
              </p>

              {/* Interactive Map */}
              <DynamicProjectMap
                center={
                  project.location.coordinates || { lat: 56.5, lng: -122.5 }
                }
                zoom={project.location.coordinates ? 8 : 5}
                marker={project.location.coordinates}
                onLocationSelect={handleMapClick}
                bufferRadiusKm={project.bufferDistanceKm}
                height="350px"
              />

              {/* Manual coordinate entry */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                    Latitude
                  </label>
                  <Input
                    type="number"
                    step="0.0001"
                    min={-90}
                    max={90}
                    placeholder="e.g. 55.7596"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                    Longitude
                  </label>
                  <Input
                    type="number"
                    step="0.0001"
                    min={-180}
                    max={180}
                    placeholder="e.g. -120.2353"
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <Button
                  variant="outline"
                  className="gap-1.5 shrink-0"
                  onClick={handleManualLocationSubmit}
                  disabled={!latInput || !lngInput}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Set Location
                </Button>
              </div>

              {project.location.coordinates && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-[11px] text-primary">
                    Location set: {project.location.coordinates.lat.toFixed(4)}N,{" "}
                    {Math.abs(project.location.coordinates.lng).toFixed(4)}W
                    {project.bufferDistanceKm > 0 && (
                      <span className="text-primary/70">
                        {" "}-- Buffer zone: {project.bufferDistanceKm} km
                      </span>
                    )}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Size */}
          <Card className="border-border bg-card shadow-wsp">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Ruler className="h-4 w-4 text-primary" />
                Project Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  placeholder={
                    selectedTypeConfig
                      ? `Enter ${selectedTypeConfig.sizeLabel.toLowerCase()}...`
                      : "Select project type first..."
                  }
                  value={project.projectSize ?? ""}
                  onChange={(e) => handleSizeChange(e.target.value)}
                  className="max-w-[200px]"
                  disabled={!selectedTypeConfig}
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {project.projectSizeUnit || "---"}
                </span>
                {selectedTypeConfig && project.projectSize !== null && project.projectSize > 0 && (
                  <Badge
                    variant="outline"
                    className={
                      project.projectSize >= selectedTypeConfig.legalThresholdValue
                        ? "border-destructive/30 bg-destructive/5 text-destructive text-[10px]"
                        : "border-primary/30 bg-primary/5 text-primary text-[10px]"
                    }
                  >
                    {project.projectSize >= selectedTypeConfig.legalThresholdValue
                      ? `Exceeds threshold (${selectedTypeConfig.legalThresholdValue} ${selectedTypeConfig.legalThresholdUnit})`
                      : `Below threshold (${selectedTypeConfig.legalThresholdValue} ${selectedTypeConfig.legalThresholdUnit})`}
                  </Badge>
                )}
              </div>
              {selectedTypeConfig && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {selectedTypeConfig.sizeLabel} -- legal threshold for screening
                  is {selectedTypeConfig.legalThresholdValue}{" "}
                  {selectedTypeConfig.legalThresholdUnit}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Project Components Checklist */}
          <Card className="border-border bg-card shadow-wsp">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Boxes className="h-4 w-4 text-primary" />
                Project Components
                <Badge variant="outline" className="ml-auto text-[9px]">
                  {project.components.length} selected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current components */}
              {project.components.length > 0 && (
                <div className="space-y-2">
                  {project.components.map((comp) => {
                    const isStandard =
                      selectedTypeConfig?.standardComponents.includes(comp) ?? false;
                    return (
                      <div
                        key={comp}
                        className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/50 px-3 py-2"
                      >
                        <Checkbox checked disabled className="pointer-events-none" />
                        <span className="flex-1 text-xs text-foreground">
                          {comp}
                        </span>
                        {isStandard ? (
                          <Badge
                            variant="outline"
                            className="text-[8px] text-muted-foreground"
                          >
                            Standard
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[8px] text-primary border-primary/30"
                          >
                            Custom
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveComponent(comp)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add standard components that aren't yet added */}
              {availableStandardComponents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-2">
                      Standard components available for{" "}
                      {selectedTypeConfig?.name}:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableStandardComponents.map((comp) => (
                        <Badge
                          key={comp}
                          variant="outline"
                          className="cursor-pointer text-[10px] hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                          onClick={() => handleToggleComponent(comp, true)}
                        >
                          <Plus className="mr-1 h-2.5 w-2.5" />
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Add custom component */}
              <Separator />
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add custom component..."
                  value={customComponent}
                  onChange={(e) => setCustomComponent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCustomComponent();
                  }}
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomComponent}
                  disabled={!customComponent.trim()}
                  className="gap-1 shrink-0"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload & AI Extraction */}
          <Card className="border-border bg-card shadow-wsp">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                Project Description Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sourceHighlight && (
                <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Viewing source:{" "}
                    <span className="font-semibold">{sourceHighlight}</span> --
                    This field was extracted from this location in the document.
                  </span>
                </div>
              )}
              <Textarea
                placeholder="Paste the project description, regulatory filing, or environmental assessment brief here. The AI will extract structured fields automatically..."
                value={intakeText || project.rawIntakeText}
                onChange={(e) => setIntakeText(e.target.value)}
                rows={8}
                className="resize-none bg-secondary text-sm"
              />
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleExtract}
                  disabled={isExtracting}
                  className="gap-2"
                >
                  {isExtracting ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Extract with AI
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.doc,.docx,.csv,.rtf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {uploadedFile ? uploadedFile.name : "Upload Document"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Extracted Fields */}
          {hasExtracted && project.extractedFields.length > 0 && (
            <Card className="border-border bg-card shadow-wsp">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI-Extracted Fields
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={handleExtract}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Re-extract
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.extractedFields.map((field, i) => (
                    <div
                      key={i}
                      className={`flex items-start justify-between gap-4 rounded-lg border p-3 ${
                        editingFieldIndex === i
                          ? "border-primary bg-primary/5"
                          : field.userOverride
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-border/50 bg-secondary/50"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {field.fieldName}
                          </span>
                          <ConfidenceIndicator value={field.confidence} />
                          {field.userOverride && (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[8px]">
                              Edited
                            </Badge>
                          )}
                        </div>
                        {editingFieldIndex === i ? (
                          <div className="mt-2 space-y-2">
                            <Input
                              value={editingFieldValue}
                              onChange={(e) => setEditingFieldValue(e.target.value)}
                              className="text-sm"
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => {
                                  updateExtractedField(i, editingFieldValue);
                                  setEditingFieldIndex(null);
                                }}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => setEditingFieldIndex(null)}
                              >
                                <X className="h-3 w-3" />
                                Cancel
                              </Button>
                              {field.userOverride && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs gap-1 text-muted-foreground"
                                  onClick={() => {
                                    updateExtractedField(i, "");
                                    setEditingFieldIndex(null);
                                  }}
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Revert to AI
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="mt-1 text-sm font-medium text-foreground">
                              {field.userOverride || field.value}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground italic">
                              {field.aiReasoning}
                            </p>
                          </>
                        )}
                        <Badge
                          variant="outline"
                          className={`mt-1.5 text-[9px] cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/30 ${
                            sourceHighlight === field.source
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "text-muted-foreground"
                          }`}
                          onClick={() => handleSourceClick(field.source)}
                          role="link"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                              handleSourceClick(field.source);
                          }}
                        >
                          <FileText className="mr-1 h-2.5 w-2.5" />
                          Source: {field.source}
                        </Badge>
                      </div>
                      {editingFieldIndex !== i && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 shrink-0 p-0"
                          title="Edit this field"
                          onClick={() => {
                            setEditingFieldIndex(i);
                            setEditingFieldValue(field.userOverride || field.value);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Gap Analysis + Completeness + Profile (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Gap Analysis / Completeness Gating */}
          <Card
            className={`border-2 shadow-wsp ${
              isComplete
                ? "border-primary/40 bg-primary/5"
                : "border-destructive/40 bg-destructive/5"
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                {isComplete ? (
                  <CircleCheck className="h-4 w-4 text-primary" />
                ) : (
                  <OctagonAlert className="h-4 w-4 text-destructive" />
                )}
                {isComplete ? "Gap Analysis -- Ready" : "Gap Analysis -- Incomplete"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isComplete && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                  <p className="text-xs font-semibold text-destructive">
                    STOP -- Complete all required fields before proceeding
                  </p>
                  <p className="mt-1 text-[11px] text-destructive/80">
                    {missingFields.length} required field
                    {missingFields.length > 1 ? "s" : ""} missing. The screening
                    process cannot begin until all project data is complete.
                  </p>
                </div>
              )}

              {isComplete && (
                <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
                  <p className="text-xs font-semibold text-primary">
                    All required fields are complete
                  </p>
                  <p className="mt-1 text-[11px] text-primary/80">
                    Project data meets the minimum requirements for screening.
                    You may proceed to Legal Threshold evaluation.
                  </p>
                </div>
              )}

              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-foreground">
                  {project.completeness}%
                </span>
                <span className="text-xs text-muted-foreground">
                  Data Completeness
                </span>
              </div>
              <Progress value={project.completeness} className="h-2" />

              <Separator />

              {/* Field checklist */}
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
                        item.done ? "text-foreground" : "text-destructive font-medium"
                      }
                    >
                      {item.label}
                    </span>
                    {!item.done && (
                      <Badge
                        variant="outline"
                        className="ml-auto text-[8px] border-destructive/30 text-destructive"
                      >
                        Required
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Project Info Card */}
          <Card className="border-border bg-card shadow-wsp">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                Project Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Type" value={project.projectType} />
              <InfoRow label="Subtype" value={project.projectSubtype} />
              <InfoRow label="ISIC Code" value={selectedTypeConfig?.isicCode || "---"} />
              <InfoRow label="Proponent" value={project.proponent} />
              <InfoRow
                label="Size"
                value={
                  project.projectSize
                    ? `${project.projectSize} ${project.projectSizeUnit}`
                    : "---"
                }
              />
              <InfoRow
                label="Buffer Distance"
                value={`${project.bufferDistanceKm} km`}
              />
              <InfoRow label="Province" value={project.location.province} />
              <InfoRow label="Region" value={project.location.region} />
              <InfoRow
                label="Coordinates"
                value={
                  project.location.coordinates
                    ? `${project.location.coordinates.lat.toFixed(4)}, ${project.location.coordinates.lng.toFixed(4)}`
                    : "---"
                }
              />
              <InfoRow
                label="Components"
                value={`${project.components.length} confirmed`}
              />
              <InfoRow
                label="Activities"
                value={`${project.physicalActivities.length} identified`}
              />
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-end border-t border-border pt-6">
        <div className="flex items-center gap-3">
          {!isComplete && (
            <p className="text-[11px] text-muted-foreground">
              Complete {missingFields.length} missing field{missingFields.length > 1 ? "s" : ""} to proceed
            </p>
          )}
          <Button
            className="gap-2"
            onClick={handleContinue}
            disabled={!isComplete}
          >
            Proceed to Legal Screening
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Source Preview Modal */}
      <SourcePreviewModal
        open={sourceModalOpen}
        onOpenChange={setSourceModalOpen}
        source={selectedSource}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value || "---"}</span>
    </div>
  );
}
