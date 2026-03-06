"use client";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  ArrowLeft,
  Zap,
  Loader2,
  Download,
  BookOpen,
  Clock,
  User,
  Pencil,
  CheckCircle2,
  ExternalLink,
  X,
  Save,
  Building2,
  MapPin,
  Scale,
} from "lucide-react";
import { AgentStatusTracker } from "@/components/project/agent-status-tracker";
import { useProjectStore } from "@/lib/stores/project-store";
import { useState, useCallback, useEffect, useMemo } from "react";

/* ───── helpers ───── */

/** Sections that represent the environmental screening table rows (3.x sections) */
function isScreeningSection(title: string) {
  return /^3\.\d/.test(title);
}

/** Sections that are appendix-like */
function isAppendixSection(title: string) {
  return /^appendic/i.test(title);
}

/**
 * Detect the "Is a Significant Effect Likely?" block at the end of a section's
 * content and return {body, determination} split.
 */
function splitDetermination(content: string) {
  const marker = "Is a Significant Effect Likely?";
  const idx = content.indexOf(marker);
  if (idx === -1) return { body: content, determination: null };
  return {
    body: content.slice(0, idx).trimEnd(),
    determination: content.slice(idx + marker.length).trim(),
  };
}

/** Derive a severity badge from determination text */
function determinationSeverity(text: string): {
  label: string;
  className: string;
} {
  const lower = text.toLowerCase();
  if (lower.includes("yes") || lower.includes("significant effects likely"))
    return {
      label: "Significant Effect Likely",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    };
  if (lower.includes("moderate"))
    return {
      label: "Moderate — Detailed Assessment Needed",
      className: "bg-wsp-orange/10 text-wsp-orange border-wsp-orange/20",
    };
  if (
    lower.includes("no significant") ||
    lower.includes("not anticipated to be significant")
  )
    return {
      label: "No Significant Effect Likely",
      className: "bg-wsp-green/10 text-wsp-green border-wsp-green/20",
    };
  return {
    label: "See Detail",
    className: "bg-muted text-muted-foreground border-border",
  };
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const {
    report,
    historicalMatches,
    consistencyReport,
    orchestrationStatus,
    thresholdEvaluation,
    contextResult,
    impactMatrix,
    mitigationResult,
    generateReport,
    runScreeningDecision,
    runContextAnalysis,
    runImpactAnalysis,
    runMitigation,
    runHistoricalComparison,
    runConsistencyValidation,
    updateReportSection,
  } = useProjectStore();

  const [isRunning, setIsRunning] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Auto-populate all prerequisite data
  useEffect(() => {
    if (!thresholdEvaluation) runScreeningDecision();
    if (!contextResult) runContextAnalysis();
    if (!impactMatrix) runImpactAnalysis();
    if (!mitigationResult) runMitigation();
    if (historicalMatches.length === 0) runHistoricalComparison();
    if (!consistencyReport) runConsistencyValidation();
  }, [
    thresholdEvaluation,
    contextResult,
    impactMatrix,
    mitigationResult,
    historicalMatches,
    consistencyReport,
    runScreeningDecision,
    runContextAnalysis,
    runImpactAnalysis,
    runMitigation,
    runHistoricalComparison,
    runConsistencyValidation,
  ]);

  const handleExportPdf = useCallback(() => {
    if (!report) return;

    // Build a clean HTML document for the report
    const sections = [...report.sections].sort((a, b) => a.order - b.order);
    const now = new Date().toLocaleDateString("en-CA");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${report.title}</title>
        <style>
          @page { margin: 2.5cm 2cm; size: A4; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; font-size: 11pt; }
          .cover { text-align: left; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #e51937; }
          .cover .wsp-logo { font-size: 28pt; font-weight: 700; color: #e51937; letter-spacing: 2px; margin-bottom: 4px; }
          .cover .client { font-size: 11pt; color: #666; margin-bottom: 16px; }
          .cover h1 { font-size: 20pt; margin: 16px 0 6px; color: #1a1a1a; }
          .cover h2 { font-size: 13pt; color: #666; font-weight: 400; margin: 0 0 20px; }
          .cover .meta { font-size: 9pt; color: #999; }
          .section { margin-bottom: 24px; page-break-inside: avoid; }
          .section h3 { font-size: 13pt; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; margin-bottom: 10px; }
          .section p { white-space: pre-line; margin: 0; }
          .section .edited { font-size: 8pt; color: #e51937; font-style: italic; margin-top: 4px; }
          .sources { margin-top: 10px; padding-top: 6px; border-top: 1px dashed #ddd; }
          .sources span { display: inline-block; font-size: 8pt; color: #888; background: #f5f5f5; padding: 2px 8px; border-radius: 3px; margin-right: 6px; margin-bottom: 4px; }
          .footer { margin-top: 40px; padding-top: 12px; border-top: 2px solid #e51937; font-size: 8pt; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <div class="cover">
          <div class="wsp-logo">WSP</div>
          <div class="client">Northern Energy Corp.</div>
          <h1>${report.title.replace("—", "\u2014")}</h1>
          <h2>EIA Screening Report</h2>
          <div class="meta">
            Issue: Draft &nbsp;|&nbsp; Prepared by: NV-IA Agent Framework v1.0 &nbsp;|&nbsp; Date: ${now} &nbsp;|&nbsp; Project ID: ${projectId}
          </div>
        </div>

        ${sections
          .map(
            (s) => `
          <div class="section">
            <h3>${s.title}</h3>
            <p>${s.content}</p>
            ${s.isEdited ? '<div class="edited">[Edited by user]</div>' : ""}
            ${
              s.sources.length > 0
                ? `<div class="sources">${s.sources.map((src) => `<span>[${src.type}] ${src.reference}</span>`).join("")}</div>`
                : ""
            }
          </div>
        `
          )
          .join("")}

        <div class="footer">
          WSP &nbsp;|&nbsp; ${report.title} &nbsp;|&nbsp; Generated ${now} &nbsp;|&nbsp; CONFIDENTIAL
        </div>
      </body>
      </html>
    `;

    // Download as HTML file (opens natively in any browser/PDF converter)
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EIA_Screening_Report_${projectId}_${now}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [report, projectId]);

  const handleStartEdit = useCallback(
    (sectionId: string, currentContent: string) => {
      setEditingSectionId(sectionId);
      setEditContent(currentContent);
    },
    [],
  );

  const handleSaveEdit = useCallback(() => {
    if (editingSectionId) {
      updateReportSection(editingSectionId, editContent);
      setEditingSectionId(null);
      setEditContent("");
    }
  }, [editingSectionId, editContent, updateReportSection]);

  const handleCancelEdit = useCallback(() => {
    setEditingSectionId(null);
    setEditContent("");
  }, []);

  const handleGenerate = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      generateReport();
      setIsRunning(false);
    }, 2500);
  }, [generateReport]);

  /* Computed section groups for the WSP-style rendering */
  const sectionGroups = useMemo(() => {
    if (!report) return null;
    const intro: typeof report.sections = [];
    const screening: typeof report.sections = [];
    const body: typeof report.sections = [];
    const appendix: typeof report.sections = [];

    for (const s of report.sections) {
      if (isAppendixSection(s.title)) appendix.push(s);
      else if (isScreeningSection(s.title)) screening.push(s);
      else if (s.order <= 2) intro.push(s);
      else body.push(s);
    }
    return { intro, screening, body, appendix };
  }, [report]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Report Generation & Review
            </h2>
            <p className="text-sm text-muted-foreground">
              AI-assembled EIA screening report following WSP standard format
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!report && !isRunning && (
            <Button
              onClick={handleGenerate}
              disabled={historicalMatches.length === 0}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              Generate Report
            </Button>
          )}
          {report && (
            <Button className="gap-2" onClick={handleExportPdf}>
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {isRunning && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-foreground">
                Generating EIA screening report from all upstream analyses...
              </span>
            </div>
            <AgentStatusTracker statuses={orchestrationStatus} />
          </CardContent>
        </Card>
      )}

      {report && sectionGroups ? (
        <Tabs defaultValue="report" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="report" className="gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              Full Report
            </TabsTrigger>
            <TabsTrigger value="screening" className="gap-1.5 text-xs">
              <Scale className="h-3.5 w-3.5" />
              Screening Table
            </TabsTrigger>
            <TabsTrigger value="sources" className="gap-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              Sources
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          {/* ═══════ FULL REPORT TAB ═══════ */}
          <TabsContent value="report" className="space-y-6">
            {/* Cover header */}
            <ReportCoverHeader report={report} />

            {/* Quality control block */}
            <Card className="border-border bg-card shadow-wsp">
              <CardContent className="p-4">
                <div className="grid grid-cols-4 gap-3 text-[10px]">
                  <div>
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider">
                      Issue
                    </p>
                    <p className="mt-0.5 text-foreground">Draft V01</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider">
                      Prepared By
                    </p>
                    <p className="mt-0.5 text-foreground">
                      AI Orchestrator + Analyst
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider">
                      Checked By
                    </p>
                    <p className="mt-0.5 text-foreground">Pending Review</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider">
                      Date
                    </p>
                    <p className="mt-0.5 text-foreground">
                      {new Date(report.generatedAt).toLocaleDateString(
                        "en-GB",
                        {
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All sections */}
            {report.sections.map((section) => (
              <ReportSection
                key={section.id}
                section={section}
                editingSectionId={editingSectionId}
                editContent={editContent}
                onStartEdit={handleStartEdit}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onEditContentChange={setEditContent}
              />
            ))}
          </TabsContent>

          {/* ═══════ SCREENING TABLE TAB ═══════ */}
          <TabsContent value="screening" className="space-y-4">
            <Card className="border-border bg-card shadow-wsp">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Table 3-1 — Review of Project against Environmental
                  Sensitivities (Schedule 3)
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Each environmental topic assessed with consideration and
                  significance determination
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-secondary/60">
                        <th className="px-4 py-2.5 text-left font-semibold text-foreground w-[220px]">
                          Consideration
                        </th>
                        <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                          Assessment
                        </th>
                        <th className="px-4 py-2.5 text-left font-semibold text-foreground w-[200px]">
                          Significant Effect Likely?
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionGroups.screening.map((section, idx) => {
                        const { body, determination } = splitDetermination(
                          section.content,
                        );
                        const severity = determination
                          ? determinationSeverity(determination)
                          : null;
                        return (
                          <tr
                            key={section.id}
                            className={`border-b border-border/50 ${idx % 2 === 0 ? "bg-card" : "bg-secondary/20"}`}
                          >
                            <td className="px-4 py-3 align-top font-medium text-foreground">
                              {section.title.replace(/^3\.\d+\s*/, "")}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <p className="text-foreground leading-relaxed whitespace-pre-line line-clamp-6">
                                {body.slice(0, 500)}
                                {body.length > 500 ? "..." : ""}
                              </p>
                              {section.sources.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {section.sources.slice(0, 3).map((s) => (
                                    <Badge
                                      key={s.id}
                                      variant="outline"
                                      className="text-[8px] font-mono text-muted-foreground"
                                    >
                                      {s.reference}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top">
                              {severity ? (
                                <Badge
                                  className={`text-[9px] border ${severity.className}`}
                                >
                                  {severity.label}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">
                                  See section
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════ SOURCES TAB ═══════ */}
          <TabsContent value="sources" className="space-y-4">
            <Card className="border-border bg-card shadow-wsp">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Source Traceability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.sections.flatMap((section) =>
                    section.sources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/50 p-3"
                      >
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[9px] font-mono"
                        >
                          {source.type}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">
                            {source.reference}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground italic">
                            {source.excerpt}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Used in: {section.title}
                          </p>
                        </div>
                      </div>
                    )),
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════ AUDIT TAB ═══════ */}
          <TabsContent value="audit" className="space-y-4">
            <Card className="border-border bg-card shadow-wsp">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Change History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.auditTrail.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/50 p-3"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">
                            {entry.actor}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {entry.action}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Section: {entry.section}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        !isRunning && (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">
                {historicalMatches.length > 0
                  ? "Generate the final EIA screening report from all upstream analyses"
                  : "Complete all previous analysis steps first"}
              </p>
            </CardContent>
          </Card>
        )
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/project/${projectId}/historical`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Historical
        </Button>
        <Button 
          className="gap-2" 
          onClick={() => router.push("/")}
          disabled={!report}
        >
          <CheckCircle2 className="h-4 w-4" />
          Finalize & Return
        </Button>
      </div>
    </div>
  );
}

/* ───── Sub-components ───── */

function ReportCoverHeader({
  report,
}: {
  report: { title: string; status: string; generatedAt: string; id: string };
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-wsp">
      {/* Red band */}
      <div className="mb-4 h-1.5 w-16 rounded-full bg-primary" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {new Date(report.generatedAt).toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}{" "}
            | DRAFT
          </p>
          <h3 className="mt-1 text-lg font-bold text-foreground leading-tight text-balance">
            Northern Energy Corp.
          </h3>
          <h4 className="text-base font-semibold text-foreground/80">
            Northern Expansion Pipeline Project
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Environmental Impact Assessment Screening Report
          </p>
        </div>
        <div className="text-right">
          <Badge
            className={`text-[9px] border-0 ${
              report.status === "final"
                ? "bg-wsp-green/10 text-wsp-green"
                : report.status === "review"
                  ? "bg-wsp-orange/10 text-wsp-orange"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {report.status.toUpperCase()}
          </Badge>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Report {report.id}
          </p>
        </div>
      </div>

      {/* Project info strip */}
      <Separator className="my-4" />
      <div className="flex gap-6">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Building2 className="h-3 w-3" />
          <span>Northern Energy Corp.</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>Northeast British Columbia</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span>120km Gas Transmission Pipeline</span>
        </div>
      </div>
    </div>
  );
}

function ReportSection({
  section,
  editingSectionId,
  editContent,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditContentChange,
}: {
  section: {
    id: string;
    title: string;
    content: string;
    sources: Array<{
      id: string;
      type: string;
      reference: string;
      excerpt: string;
    }>;
    order: number;
    isEdited: boolean;
  };
  editingSectionId: string | null;
  editContent: string;
  onStartEdit: (id: string, content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditContentChange: (val: string) => void;
}) {
  const isScreening = isScreeningSection(section.title);
  const { body, determination } = splitDetermination(section.content);
  const severity = determination
    ? determinationSeverity(determination)
    : null;
  const isEditing = editingSectionId === section.id;

  return (
    <Card
      className={`border-border bg-card shadow-wsp ${isScreening ? "border-l-2 border-l-primary/30" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            {section.title}
            {section.isEdited && (
              <Badge variant="outline" className="text-[8px] text-wsp-orange">
                Edited
              </Badge>
            )}
          </CardTitle>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-primary hover:text-primary"
                onClick={onSaveEdit}
              >
                <Save className="h-3 w-3" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={onCancelEdit}
              >
                <X className="h-3 w-3" />
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => onStartEdit(section.id, section.content)}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            rows={12}
            className="text-xs leading-relaxed resize-y font-mono"
            autoFocus
          />
        ) : (
          <>
            <p className="text-xs leading-relaxed text-foreground whitespace-pre-line">
              {body}
            </p>

            {/* Screening determination box */}
            {isScreening && determination && severity && (
              <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Is a Significant Effect Likely?
                </p>
                <Badge className={`text-[10px] border ${severity.className}`}>
                  {severity.label}
                </Badge>
                <p className="mt-2 text-xs leading-relaxed text-foreground">
                  {determination}
                </p>
              </div>
            )}
          </>
        )}

        {section.sources.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {section.sources.map((source) => (
              <Badge
                key={source.id}
                variant="outline"
                className="text-[8px] font-mono text-muted-foreground"
              >
                [{source.type}] {source.reference}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
