// ============================================================
// EIA Screening Platform — Enterprise Type Definitions
// ============================================================

// ---------- Enums ----------

export enum ProjectState {
  DRAFT = "draft",
  READY_FOR_SCREENING = "ready_for_screening",
  EXEMPT = "exempt",
  SCREENING_REQUIRED = "screening_required",
  ANALYSIS_COMPLETE = "analysis_complete",
  UNDER_REVIEW = "under_review",
  FINALISED = "finalised",
}

export enum ScreeningOutcome {
  EXEMPT = "exempt",
  SCREENING_REQUIRED = "screening_required",
  PENDING = "pending",
}

export enum Severity {
  NONE = "none",
  LOW = "low",
  MODERATE = "moderate",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum AgentPhase {
  IDLE = "idle",
  RUNNING = "running",
  COMPLETE = "complete",
  ERROR = "error",
  SKIPPED = "skipped",
}

export enum WizardStep {
  SETUP = "setup",
  PROJECT_ANALYSIS = "project-analysis",
  LEGAL = "legal",
  CONTEXT = "context",
  IMPACT = "impact",
  MITIGATION = "mitigation",
  HISTORICAL = "historical",
  REVIEW = "review",
}

// ---------- Project Types Library ----------

export interface ProjectTypeConfig {
  id: string;
  name: string;
  subtype: string;
  isicCode: string;
  bufferDistanceKm: number;
  sizeUnit: string;
  sizeLabel: string;
  legalThresholdValue: number;
  legalThresholdUnit: string;
  standardComponents: string[];
  standardActivities: string[];
}

// ---------- Core Project ----------

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  projectType: string;
  projectTypeId: string;
  projectSubtype: string;
  proponent: string;
  location: ProjectLocation;
  projectSize: number | null;
  projectSizeUnit: string;
  bufferDistanceKm: number;
  physicalActivities: string[];
  components: string[];
  rawIntakeText: string;
  extractedFields: ExtractedField[];
  completeness: number;
  state: ProjectState;
  screeningOutcome: ScreeningOutcome;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectLocation {
  province: string;
  region: string;
  coordinates: { lat: number; lng: number } | null;
  nearbyFeatures: string[];
  indigenousTerritory: string[];
}

export interface ExtractedField {
  fieldName: string;
  value: string;
  confidence: number;
  source: string;
  aiReasoning: string;
  userOverride: string | null;
}

// ---------- Legal Threshold ----------

export interface ThresholdEvaluation {
  projectTypeId: string;
  projectTypeName: string;
  regulatoryReferences: RegulatoryReference[];
  triggers: ThresholdTrigger[];
  overallOutcome: ScreeningOutcome;
  reasoning: string;
}

export interface RegulatoryReference {
  id: string;
  name: string;
  section: string;
  description: string;
  url: string;
}

export interface ThresholdTrigger {
  id: string;
  name: string;
  description: string;
  triggered: boolean;
  confidence: number;
  reasoning: string;
  regulatoryRef: string;
}

// ---------- Context Analysis ----------

export interface ContextResult {
  sensitiveAreas: SensitiveArea[];
  vecs: VEC[];
  spatialOverlays: SpatialOverlay[];
  contextSummary: string;
}

export interface SensitiveArea {
  id: string;
  name: string;
  type: string;
  distance: number;
  severity: Severity;
  description: string;
  coordinates: { lat: number; lng: number } | null;
}

export interface VEC {
  id: string;
  name: string;
  category: string;
  description: string;
  relevanceScore: number;
  regulatoryBasis: string;
  selected: boolean;
}

export interface SpatialOverlay {
  id: string;
  name: string;
  layerType: string;
  intersects: boolean;
  areaOfOverlap: number;
}

// ---------- Impact Analysis ----------

export interface ImpactMatrix {
  impactFactors: ImpactFactor[];
  vecs: VEC[];
  cells: ImpactCell[];
}

export interface ImpactFactor {
  id: string;
  name: string;
  category: string;
  description: string;
  phase: string;
}

export interface ImpactCell {
  impactFactorId: string;
  vecId: string;
  severity: Severity;
  likelihood: string;
  duration: string;
  reversibility: string;
  aiReasoning: string;
  userOverride: CellOverride | null;
}

export interface CellOverride {
  severity: Severity;
  justification: string;
  overriddenBy: string;
  overriddenAt: string;
}

// ---------- Mitigation ----------

export interface MitigationMeasure {
  id: string;
  impactFactorId: string;
  vecId: string;
  title: string;
  description: string;
  type: "avoidance" | "minimisation" | "rehabilitation" | "offset";
  effectiveness: Severity;
  residualImpact: Severity;
  source: string;
  isCustom: boolean;
}

export interface MitigationResult {
  measures: MitigationMeasure[];
  summary: string;
  gapAnalysis: MitigationGap[];
}

export interface MitigationGap {
  impactFactorId: string;
  vecId: string;
  description: string;
  recommendation: string;
}

// ---------- Historical Comparison ----------

export interface HistoricalMatch {
  id: string;
  projectName: string;
  projectType: string;
  year: number;
  outcome: string;
  similarityScore: number;
  /** Phase 1: Project Description & Context comparison */
  structuralComparison: StructuralComparison;
  /** Phase 2: Impact & Mitigation comparison (per NV IA workflow dual-phase) */
  impactMitigationComparison?: StructuralComparison;
  /** Decision criteria comparison (applies to both phases) */
  decisionComparison: DecisionComparison;
}

export interface StructuralComparison {
  componentOverlap: number;
  styleConsistency: number;
  lengthRatio: number;
  notes: string;
  /** "project_description" | "impacts_mitigation" */
  comparisonPhase?: string;
  /** Phase 1 checklist: components_comparable, style_comparable, length_comparable, gaps_identified */
  phase1Checklist?: Record<string, boolean>;
  /** Phase 2 checklist: impacts_comparable, mitigations_comparable, style_comparable, gaps_identified */
  phase2Checklist?: Record<string, boolean>;
}

export interface DecisionComparison {
  outcomeMatch: boolean;
  criteriaAlignment: number;
  divergences: string[];
  notes: string;
}

// ---------- Consistency Validation ----------

export interface ConsistencyReport {
  overallScore: number;
  gaps: ConsistencyGap[];
  deviations: ConsistencyDeviation[];
  recommendations: string[];
}

export interface ConsistencyGap {
  id: string;
  section: string;
  description: string;
  severity: Severity;
  suggestedFix: string;
}

export interface ConsistencyDeviation {
  id: string;
  section: string;
  description: string;
  historicalNorm: string;
  currentValue: string;
  severity: Severity;
}

// ---------- Report ----------

export interface ScreeningReport {
  id: string;
  projectId: string;
  title: string;
  sections: ReportSection[];
  auditTrail: AuditEntry[];
  generatedAt: string;
  status: "draft" | "review" | "final";
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  sources: SourceTrace[];
  order: number;
  isEdited: boolean;
}

export interface SourceTrace {
  id: string;
  type: "regulation" | "library" | "historical" | "ai_generated";
  reference: string;
  excerpt: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  section: string;
  previousValue: string;
  newValue: string;
}

// ---------- Agent Status ----------

export interface AgentStatus {
  executorName: string;
  displayName: string;
  phase: AgentPhase;
  progress: number;
  message: string;
  startedAt: string | null;
  completedAt: string | null;
}

// ---------- Wizard Navigation ----------

export interface WizardStepConfig {
  id: WizardStep;
  label: string;
  description: string;
  path: string;
  requiredStates: ProjectState[];
  skippedWhenExempt: boolean;
  /** If set, this step runs in parallel with the specified step */
  parallelWith?: WizardStep;
}

export const WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: WizardStep.SETUP,
    label: "Project Setup",
    description: "Project type, location, and description intake",
    path: "setup",
    requiredStates: [ProjectState.DRAFT],
    skippedWhenExempt: false,
  },
  {
    id: WizardStep.PROJECT_ANALYSIS,
    label: "Project Analysis",
    description: "Derive actions and impact factors from components",
    path: "project-analysis",
    requiredStates: [ProjectState.DRAFT, ProjectState.READY_FOR_SCREENING],
    skippedWhenExempt: false,
  },
  {
    id: WizardStep.LEGAL,
    label: "Legal Categorization",
    description: "Regulatory threshold evaluation",
    path: "legal",
    requiredStates: [ProjectState.DRAFT, ProjectState.READY_FOR_SCREENING],
    skippedWhenExempt: false,
  },
  {
    id: WizardStep.CONTEXT,
    label: "Context Analysis",
    description: "Geospatial overlays and sensitive area identification",
    path: "context",
    requiredStates: [ProjectState.READY_FOR_SCREENING, ProjectState.SCREENING_REQUIRED],
    skippedWhenExempt: false,
  },
  {
    id: WizardStep.IMPACT,
    label: "Impact Analysis",
    description: "Impact factor matrix assessment",
    path: "impact",
    requiredStates: [ProjectState.SCREENING_REQUIRED],
    skippedWhenExempt: true,
  },
  {
    id: WizardStep.MITIGATION,
    label: "Mitigation",
    description: "Mitigation measures and residual impact",
    path: "mitigation",
    requiredStates: [ProjectState.SCREENING_REQUIRED],
    skippedWhenExempt: true,
  },
  {
    id: WizardStep.HISTORICAL,
    label: "Historical",
    description: "Past precedent comparison",
    path: "historical",
    requiredStates: [ProjectState.SCREENING_REQUIRED],
    skippedWhenExempt: true,
  },
  {
    id: WizardStep.REVIEW,
    label: "Report & Review",
    description: "Final report generation and audit trail",
    path: "review",
    requiredStates: [
      ProjectState.SCREENING_REQUIRED,
      ProjectState.ANALYSIS_COMPLETE,
      ProjectState.UNDER_REVIEW,
      ProjectState.EXEMPT,
    ],
    skippedWhenExempt: false,
  },
];
