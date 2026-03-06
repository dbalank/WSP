import { create } from "zustand";
import type {
  ProjectData,
  ProjectTypeConfig,
  AgentStatus,
  ContextResult,
  ImpactMatrix,
  ImpactCell,
  CellOverride,
  MitigationResult,
  HistoricalMatch,
  ConsistencyReport,
  ScreeningReport,
  ThresholdEvaluation,
  WizardStep,
} from "@/lib/types";
import {
  ProjectState,
  ScreeningOutcome,
  AgentPhase,
} from "@/lib/types";

// ---------- Project Types Library ----------

export const PROJECT_TYPES_LIBRARY: ProjectTypeConfig[] = [
  {
    id: "pipeline_gas",
    name: "Natural Gas Pipeline",
    subtype: "Natural Gas Transmission",
    isicCode: "D35.2",
    bufferDistanceKm: 1.5,
    sizeUnit: "km",
    sizeLabel: "Pipeline Length",
    legalThresholdValue: 40,
    legalThresholdUnit: "km",
    standardComponents: [
      "Pipeline (transmission)",
      "Compressor stations",
      "Metering stations",
      "River crossings (HDD)",
      "Access roads (temporary)",
      "Laydown areas",
      "Valve sites",
      "Pig launcher/receiver stations",
    ],
    standardActivities: [
      "Pipeline installation",
      "Compressor station construction",
      "River crossing construction",
      "Temporary access road construction",
      "Right-of-way clearing",
      "Hydrostatic testing",
      "Blasting (if required)",
    ],
  },
  {
    id: "mine_metal",
    name: "Metal Mine",
    subtype: "Open Pit / Underground",
    isicCode: "B07.1",
    bufferDistanceKm: 3.0,
    sizeUnit: "tonnes/year",
    sizeLabel: "Production Capacity",
    legalThresholdValue: 3000,
    legalThresholdUnit: "tonnes/day",
    standardComponents: [
      "Open pit / underground workings",
      "Ore processing plant",
      "Tailings management facility",
      "Waste rock storage area",
      "Water treatment plant",
      "Access roads",
      "Power supply infrastructure",
      "Worker accommodation camp",
    ],
    standardActivities: [
      "Excavation and blasting",
      "Ore processing and milling",
      "Tailings deposition",
      "Water management and treatment",
      "Waste rock disposal",
      "Haul road operation",
      "Site decommissioning and rehabilitation",
    ],
  },
  {
    id: "wind_energy",
    name: "Wind Energy Facility",
    subtype: "Onshore Wind Farm",
    isicCode: "D35.1.1",
    bufferDistanceKm: 2.0,
    sizeUnit: "MW",
    sizeLabel: "Installed Capacity",
    legalThresholdValue: 10,
    legalThresholdUnit: "MW",
    standardComponents: [
      "Wind turbines",
      "Turbine foundations",
      "Access tracks",
      "Substation and grid connection",
      "Underground cabling",
      "Control building",
      "Temporary construction compound",
      "Borrow pit (if required)",
    ],
    standardActivities: [
      "Foundation construction",
      "Turbine erection",
      "Cable trenching",
      "Substation construction",
      "Access track construction",
      "Vegetation clearing",
      "Decommissioning",
    ],
  },
  {
    id: "hydroelectric",
    name: "Hydroelectric Dam",
    subtype: "Run-of-River / Storage",
    isicCode: "D35.1.2",
    bufferDistanceKm: 5.0,
    sizeUnit: "MW",
    sizeLabel: "Generating Capacity",
    legalThresholdValue: 200,
    legalThresholdUnit: "MW",
    standardComponents: [
      "Dam structure",
      "Reservoir / headpond",
      "Powerhouse",
      "Spillway",
      "Fish passage facility",
      "Transmission line",
      "Switchyard",
      "Access roads",
      "Worker camp",
    ],
    standardActivities: [
      "River diversion",
      "Dam construction",
      "Reservoir impoundment",
      "Powerhouse construction",
      "Transmission line installation",
      "Fish passage construction",
      "Vegetation clearing (reservoir area)",
      "Flow regulation",
    ],
  },
  {
    id: "lng_terminal",
    name: "LNG Terminal",
    subtype: "Export / Import Terminal",
    isicCode: "D35.2.1",
    bufferDistanceKm: 2.5,
    sizeUnit: "MTPA",
    sizeLabel: "Processing Capacity",
    legalThresholdValue: 3000,
    legalThresholdUnit: "tonnes/day LNG",
    standardComponents: [
      "Liquefaction trains",
      "LNG storage tanks",
      "Marine jetty / loading facility",
      "Gas pretreatment plant",
      "Flare system",
      "Cooling water system",
      "Power generation",
      "Administration buildings",
    ],
    standardActivities: [
      "Site preparation and grading",
      "Marine construction (jetty/piles)",
      "Liquefaction plant construction",
      "Tank construction",
      "Dredging (if required)",
      "Pipeline tie-in",
      "Commissioning and start-up",
    ],
  },
  {
    id: "solar_farm",
    name: "Solar Farm",
    subtype: "Utility-Scale Photovoltaic",
    isicCode: "D35.1.3",
    bufferDistanceKm: 0.5,
    sizeUnit: "MW",
    sizeLabel: "Installed Capacity",
    legalThresholdValue: 10,
    legalThresholdUnit: "MW",
    standardComponents: [
      "Solar panels / arrays",
      "Mounting structures",
      "Inverter stations",
      "Substation and grid connection",
      "Underground / overhead cabling",
      "Access tracks",
      "Security fencing",
      "Battery storage (if applicable)",
    ],
    standardActivities: [
      "Site clearance and grading",
      "Mounting structure installation",
      "Panel installation",
      "Cable trenching",
      "Substation construction",
      "Fencing installation",
      "Decommissioning",
    ],
  },
  {
    id: "transmission_line",
    name: "Transmission Line",
    subtype: "High-Voltage Overhead / Underground",
    isicCode: "D35.1.4",
    bufferDistanceKm: 1.0,
    sizeUnit: "km",
    sizeLabel: "Line Length",
    legalThresholdValue: 75,
    legalThresholdUnit: "km (345kV+)",
    standardComponents: [
      "Transmission towers / poles",
      "Conductors and insulators",
      "Substations (terminal)",
      "Access roads",
      "Laydown areas",
      "Guyed anchors",
      "Underground cable sections (if applicable)",
    ],
    standardActivities: [
      "Right-of-way clearing",
      "Foundation construction",
      "Tower erection",
      "Conductor stringing",
      "Substation construction",
      "Access road construction",
      "Vegetation management (ongoing)",
    ],
  },
];

// ---------- Mock data factory ----------

// Demo Project IDs
export const DEMO_PROJECTS = {
  PIPELINE: "proj_demo_pipeline",
  TRANSMISSION_LINE: "proj_demo_transmission",
} as const;

function createMockPipelineProject(id: string): ProjectData {
  return {
    id,
    name: "Northern Expansion Pipeline Project",
    description:
      "Proposed 120km natural gas pipeline through the Northern Boreal region connecting the Dawson Creek processing facility to the Prince Rupert LNG export terminal. Project includes 3 compressor stations, 2 river crossings, and associated temporary access roads.",
    projectType: "Natural Gas Pipeline",
    projectTypeId: "pipeline_gas",
    projectSubtype: "Natural Gas Transmission",
    proponent: "Northern Energy Corp.",
    location: {
      province: "British Columbia",
      region: "Northern Boreal",
      coordinates: { lat: 55.7596, lng: -120.2353 },
      nearbyFeatures: [
        "Peace River watershed",
        "Boreal caribou habitat",
        "Treaty 8 territory",
      ],
      indigenousTerritory: [
        "Treaty 8 First Nations",
        "West Moberly First Nations",
      ],
    },
    projectSize: 120,
    projectSizeUnit: "km",
    bufferDistanceKm: 1.5,
    physicalActivities: [
      "Pipeline installation (120km)",
      "Compressor station construction (3)",
      "River crossing construction (2)",
      "Temporary access road construction",
      "Right-of-way clearing",
      "Hydrostatic testing",
    ],
    components: [
      "Pipeline (120km, 36-inch diameter)",
      "Compressor stations (3)",
      "Metering stations (2)",
      "River crossings (2 HDD)",
      "Access roads (45km temporary)",
      "Laydown areas (6)",
    ],
    rawIntakeText:
      "Northern Energy Corp. proposes to construct and operate a 120-kilometre natural gas pipeline in northeast British Columbia...",
    extractedFields: [
      {
        fieldName: "Project Name",
        value: "Northern Expansion Pipeline Project",
        confidence: 0.97,
        source: "Document header",
        aiReasoning: "Extracted from the main title of the project description document",
        userOverride: null,
      },
      {
        fieldName: "Pipeline Length",
        value: "120 km",
        confidence: 0.95,
        source: "Section 2.1",
        aiReasoning:
          "Multiple references to 120km pipeline length throughout the document",
        userOverride: null,
      },
      {
        fieldName: "Proponent",
        value: "Northern Energy Corp.",
        confidence: 0.99,
        source: "Cover page",
        aiReasoning: "Company name clearly identified on the cover page",
        userOverride: null,
      },
      {
        fieldName: "Province",
        value: "British Columbia",
        confidence: 0.98,
        source: "Section 1.2",
        aiReasoning: "Geographic location specified in project overview section",
        userOverride: null,
      },
      {
        fieldName: "River Crossings",
        value: "2 (HDD method)",
        confidence: 0.88,
        source: "Section 3.4",
        aiReasoning:
          "River crossing details found in construction methodology section; HDD inferred from crossing descriptions",
        userOverride: null,
      },
    ],
    completeness: 100,
    state: ProjectState.DRAFT,
    screeningOutcome: ScreeningOutcome.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createMockTransmissionLineProject(id: string): ProjectData {
  return {
    id,
    name: "BC Hydro Northern Reinforcement Transmission Line",
    description:
      "Proposed 185km 500kV transmission line from the Peace River Site C Dam to the Prince George substation, including new terminal substations and access roads through the Rocky Mountain Trench.",
    projectType: "Transmission Line",
    projectTypeId: "transmission_line",
    projectSubtype: "High-Voltage Overhead / Underground",
    proponent: "BC Hydro",
    location: {
      province: "British Columbia",
      region: "Peace River / Rocky Mountain Trench",
      coordinates: { lat: 56.0834, lng: -121.8689 },
      nearbyFeatures: [
        "Peace River Valley",
        "Rocky Mountain Trench",
        "Williston Reservoir",
        "Migratory bird corridor",
      ],
      indigenousTerritory: [
        "Treaty 8 First Nations",
        "Saulteau First Nations",
        "McLeod Lake Indian Band",
      ],
    },
    projectSize: 185,
    projectSizeUnit: "km",
    bufferDistanceKm: 1.0,
    physicalActivities: [
      "Right-of-way clearing (185km)",
      "Tower foundation construction (450 towers)",
      "Tower erection",
      "Conductor stringing",
      "Substation construction (2 terminal)",
      "Access road construction (65km)",
      "Vegetation management program",
    ],
    components: [
      "Transmission towers / poles",
      "Conductors and insulators",
      "Substations (terminal)",
      "Access roads",
      "Laydown areas",
      "Guyed anchors",
    ],
    rawIntakeText:
      "BC Hydro proposes to construct a 185-kilometre 500kV transmission line from the Site C Clean Energy Project to Prince George to reinforce the provincial grid and deliver clean electricity to northern communities...",
    extractedFields: [
      {
        fieldName: "Project Name",
        value: "BC Hydro Northern Reinforcement Transmission Line",
        confidence: 0.98,
        source: "Document header",
        aiReasoning: "Extracted from the main title of the project description document",
        userOverride: null,
      },
      {
        fieldName: "Line Length",
        value: "185 km",
        confidence: 0.96,
        source: "Section 2.1",
        aiReasoning:
          "Transmission line length specified in project overview and technical specifications",
        userOverride: null,
      },
      {
        fieldName: "Voltage Class",
        value: "500 kV",
        confidence: 0.99,
        source: "Section 2.2",
        aiReasoning: "Voltage rating clearly specified in technical specifications",
        userOverride: null,
      },
      {
        fieldName: "Proponent",
        value: "BC Hydro",
        confidence: 0.99,
        source: "Cover page",
        aiReasoning: "BC Hydro identified as the project proponent",
        userOverride: null,
      },
      {
        fieldName: "Number of Towers",
        value: "Approximately 450",
        confidence: 0.85,
        source: "Section 3.1",
        aiReasoning: "Tower count estimated based on typical span lengths and terrain",
        userOverride: null,
      },
      {
        fieldName: "Terminal Substations",
        value: "2 (Site C, Prince George)",
        confidence: 0.92,
        source: "Section 3.5",
        aiReasoning: "Substation locations identified at line termination points",
        userOverride: null,
      },
    ],
    completeness: 100,
    state: ProjectState.DRAFT,
    screeningOutcome: ScreeningOutcome.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createMockProject(id: string): ProjectData {
  // Route to appropriate demo project based on ID
  if (id === DEMO_PROJECTS.TRANSMISSION_LINE) {
    return createMockTransmissionLineProject(id);
  }
  // Default to pipeline project
  return createMockPipelineProject(id);
}

// ---------- Store Interface ----------

interface ProjectStore {
  // Data
  project: ProjectData | null;
  thresholdEvaluation: ThresholdEvaluation | null;
  orchestrationStatus: AgentStatus[];
  contextResult: ContextResult | null;
  impactMatrix: ImpactMatrix | null;
  mitigationResult: MitigationResult | null;
  historicalMatches: HistoricalMatch[];
  consistencyReport: ConsistencyReport | null;
  report: ScreeningReport | null;
  currentStep: WizardStep;

  // Actions
  loadProject: (id: string) => void;
  setProject: (data: ProjectData) => void;
  setThresholdEvaluation: (data: ThresholdEvaluation) => void;
  updateOrchestrationStatus: (status: AgentStatus[]) => void;
  setContextResult: (data: ContextResult) => void;
  setImpactMatrix: (data: ImpactMatrix) => void;
  setCellOverride: (
    ifId: string,
    vecId: string,
    override: CellOverride
  ) => void;
  toggleImpactCell: (ifId: string, vecId: string) => void;
  setMitigationResult: (data: MitigationResult) => void;
  setHistoricalMatches: (data: HistoricalMatch[]) => void;
  setConsistencyReport: (data: ConsistencyReport) => void;
  setReport: (data: ScreeningReport) => void;
  setCurrentStep: (step: WizardStep) => void;
  advanceProjectState: (newState: ProjectState) => void;
  runScreeningDecision: () => void;
  runContextAnalysis: () => void;
  runImpactAnalysis: () => void;
  runMitigation: () => void;
  runHistoricalComparison: () => void;
  runConsistencyValidation: () => void;
  generateReport: () => void;
  updateReportSection: (sectionId: string, newContent: string) => void;
  updateProjectType: (typeId: string) => void;
  updateProjectSize: (size: number | null) => void;
  updateProjectComponents: (components: string[]) => void;
  updateProjectLocation: (lat: number, lng: number) => void;
  recalcCompleteness: () => void;
  updateExtractedField: (fieldIndex: number, newValue: string) => void;
  }

// ---------- Store ----------

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  thresholdEvaluation: null,
  orchestrationStatus: [
    {
      executorName: "project_structuring",
      displayName: "Project Structuring",
      phase: AgentPhase.IDLE,
      progress: 0,
      message: "",
      startedAt: null,
      completedAt: null,
    },
    {
      executorName: "legal_threshold",
      displayName: "Legal Threshold",
      phase: AgentPhase.IDLE,
      progress: 0,
      message: "",
      startedAt: null,
      completedAt: null,
    },
    {
      executorName: "screening_decision",
      displayName: "Screening Decision",
      phase: AgentPhase.IDLE,
      progress: 0,
      message: "",
      startedAt: null,
      completedAt: null,
    },
    {
      executorName: "context_analysis",
      displayName: "Context Analysis",
      phase: AgentPhase.IDLE,
      progress: 0,
      message: "",
      startedAt: null,
      completedAt: null,
    },
    {
      executorName: "impact_analysis",
      displayName: "Impact Analysis",
      phase: AgentPhase.IDLE,
      progress: 0,
      message: "",
      startedAt: null,
      completedAt: null,
    },
    {
      executorName: "mitigation",
      displayName: "Mitigation",
      phase: AgentPhase.IDLE,
      progress: 0,
      message: "",
      startedAt: null,
      completedAt: null,
    },
    {
      executorName: "historical_comparison",
      displayName: "Historical Comparison",
      phase: AgentPhase.IDLE,
      progress: 0,
      message: "",
      startedAt: null,
      completedAt: null,
    },
    {
      executorName: "consistency_validation",
      displayName: "Consistency Validation",
      phase: AgentPhase.IDLE,
      progress: 0,
      message: "",
      startedAt: null,
      completedAt: null,
    },
    {
      executorName: "report_generation",
      displayName: "Report Generation",
      phase: AgentPhase.IDLE,
      progress: 0,
      message: "",
      startedAt: null,
      completedAt: null,
    },
  ],
  contextResult: null,
  impactMatrix: null,
  mitigationResult: null,
  historicalMatches: [],
  consistencyReport: null,
  report: null,
  currentStep: "setup" as WizardStep,

loadProject: (id: string) => {
  const project = createMockProject(id);
  // Reset all analysis results when loading a new project
  set({ 
    project,
    thresholdEvaluation: null,
    contextResult: null,
    impactMatrix: null,
    mitigationResult: null,
    historicalMatches: [],
    consistencyReport: null,
    report: null,
  });
  },

  setProject: (data) => set({ project: data }),

  setThresholdEvaluation: (data) => set({ thresholdEvaluation: data }),

  updateOrchestrationStatus: (status) =>
    set({ orchestrationStatus: status }),

  setContextResult: (data) => set({ contextResult: data }),

  setImpactMatrix: (data) => set({ impactMatrix: data }),

  setCellOverride: (ifId, vecId, override) => {
    const matrix = get().impactMatrix;
    if (!matrix) return;
    const updatedCells = matrix.cells.map((cell) =>
      cell.impactFactorId === ifId && cell.vecId === vecId
        ? { ...cell, userOverride: override }
        : cell
    );
    set({ impactMatrix: { ...matrix, cells: updatedCells } });
  },

  toggleImpactCell: (ifId, vecId) => {
    const matrix = get().impactMatrix;
    if (!matrix) return;
    const updatedCells = matrix.cells.map((cell) => {
      if (cell.impactFactorId !== ifId || cell.vecId !== vecId) return cell;
      const isCurrentlyOff =
        cell.userOverride?.severity === "none";
      if (isCurrentlyOff) {
        // Toggle ON: remove override to restore original AI severity
        return { ...cell, userOverride: null };
      } else {
        // Toggle OFF: set severity to NONE
        return {
          ...cell,
          userOverride: {
            severity: "none" as const,
            justification: "User toggled off",
            overriddenBy: "user",
            overriddenAt: new Date().toISOString(),
          },
        };
      }
    });
    set({ impactMatrix: { ...matrix, cells: updatedCells } });
  },

  setMitigationResult: (data) => set({ mitigationResult: data }),

  setHistoricalMatches: (data) => set({ historicalMatches: data }),

  setConsistencyReport: (data) => set({ consistencyReport: data }),

  setReport: (data) => set({ report: data }),

  setCurrentStep: (step) => set({ currentStep: step }),

  advanceProjectState: (newState) => {
    const project = get().project;
    if (!project) return;
    set({ project: { ...project, state: newState, updatedAt: new Date().toISOString() } });
  },

  // Simulated orchestration actions (in production, these hit the Python backend)

  runScreeningDecision: () => {
    const project = get().project;
    if (!project) return;

    // Simulate agent progression
    const statusCopy = [...get().orchestrationStatus];
    statusCopy[0] = { ...statusCopy[0], phase: AgentPhase.COMPLETE, progress: 100 };
    statusCopy[1] = { ...statusCopy[1], phase: AgentPhase.COMPLETE, progress: 100 };
    statusCopy[2] = { ...statusCopy[2], phase: AgentPhase.COMPLETE, progress: 100 };
    set({ orchestrationStatus: statusCopy });

    set({
      thresholdEvaluation: {
        projectTypeId: "pipeline_gas",
        projectTypeName: "Natural Gas Pipeline",
        regulatoryReferences: [
          {
            id: "ref_1",
            name: "Impact Assessment Act (2019)",
            section: "Schedule, s. 43",
            description: "Pipeline threshold: exceeds 40km in length",
            url: "#",
          },
          {
            id: "ref_2",
            name: "Physical Activities Regulations",
            section: "SOR/2019-285, s. 18",
            description: "Gas pipeline with capacity > 500,000 m3/day",
            url: "#",
          },
        ],
        triggers: [
          {
            id: "t1",
            name: "Pipeline Length Threshold",
            description: "Pipeline exceeds 40km in a new right-of-way",
            triggered: true,
            confidence: 0.96,
            reasoning: "At 120km, the proposed pipeline significantly exceeds the 40km threshold under the Physical Activities Regulations.",
            regulatoryRef: "SOR/2019-285, s. 18(a)",
          },
          {
            id: "t2",
            name: "Watercourse Crossing",
            description: "Pipeline crosses a navigable waterway",
            triggered: true,
            confidence: 0.91,
            reasoning: "Two river crossings identified, including Peace River which is classified as a navigable waterway.",
            regulatoryRef: "IAA s. 43(b)",
          },
          {
            id: "t3",
            name: "Indigenous Territory",
            description: "Project in established or asserted indigenous territory",
            triggered: true,
            confidence: 0.94,
            reasoning: "Project traverses Treaty 8 territory and proximity to West Moberly First Nations traditional land use areas.",
            regulatoryRef: "IAA s. 7(e)",
          },
        ],
        overallOutcome: ScreeningOutcome.SCREENING_REQUIRED,
        reasoning:
          "The project triggers multiple thresholds under the Impact Assessment Act and Physical Activities Regulations. Full screening is required.",
      },
      project: {
        ...project,
        state: ProjectState.SCREENING_REQUIRED,
        screeningOutcome: ScreeningOutcome.SCREENING_REQUIRED,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  runContextAnalysis: () => {
    const statusCopy = [...get().orchestrationStatus];
    statusCopy[3] = { ...statusCopy[3], phase: AgentPhase.COMPLETE, progress: 100 };
    set({
      orchestrationStatus: statusCopy,
      contextResult: {
        sensitiveAreas: [
          {
            id: "sa1",
            name: "Peace River Watershed",
            type: "Watercourse",
            distance: 0,
            severity: "high" as never,
            description:
              "Major river system with critical fish habitat. Pipeline crosses via HDD.",
            coordinates: { lat: 56.2, lng: -120.8 },
          },
          {
            id: "sa2",
            name: "Boreal Caribou Critical Habitat",
            type: "Wildlife Habitat",
            distance: 2.5,
            severity: "critical" as never,
            description:
              "Federal recovery strategy identifies this zone as critical for Southern Mountain caribou population.",
            coordinates: { lat: 55.9, lng: -120.5 },
          },
          {
            id: "sa3",
            name: "Old Growth Forest Stand",
            type: "Vegetation",
            distance: 0.3,
            severity: "moderate" as never,
            description:
              "Mature boreal mixedwood stand with trees > 120 years. Adjacent to proposed ROW.",
            coordinates: { lat: 55.8, lng: -120.3 },
          },
          {
            id: "sa4",
            name: "Treaty 8 Sacred Site",
            type: "Cultural Heritage",
            distance: 1.2,
            severity: "high" as never,
            description:
              "Traditional gathering and ceremonial site identified through consultation.",
            coordinates: { lat: 55.85, lng: -120.4 },
          },
        ],
        vecs: [
          { id: "vec1", name: "Surface Water Quality", category: "Aquatic", description: "Rivers, streams, and wetlands potentially affected by construction and operation", relevanceScore: 0.94, regulatoryBasis: "Fisheries Act s. 35", selected: true },
          { id: "vec2", name: "Boreal Caribou", category: "Wildlife", description: "Southern Mountain caribou — federally listed as Threatened under SARA", relevanceScore: 0.97, regulatoryBasis: "SARA Schedule 1", selected: true },
          { id: "vec3", name: "Migratory Birds", category: "Wildlife", description: "Nesting habitat for migratory bird species in boreal forest", relevanceScore: 0.82, regulatoryBasis: "Migratory Birds Convention Act", selected: true },
          { id: "vec4", name: "Traditional Land Use", category: "Indigenous", description: "Treaty 8 First Nations traditional land use, harvesting, and cultural practices", relevanceScore: 0.91, regulatoryBasis: "IAA s. 22(1)(c)", selected: true },
          { id: "vec5", name: "Soil and Terrain", category: "Physical", description: "Terrain stability, permafrost areas, and soil contamination potential", relevanceScore: 0.78, regulatoryBasis: "BC Environmental Management Act", selected: true },
          { id: "vec6", name: "Air Quality", category: "Physical", description: "Compressor station emissions and construction dust", relevanceScore: 0.72, regulatoryBasis: "BC Clean Air Act", selected: true },
          { id: "vec7", name: "Greenhouse Gas Emissions", category: "Climate", description: "Construction and operational GHG contributions", relevanceScore: 0.85, regulatoryBasis: "IAA s. 22(1)(i)", selected: true },
        ],
        spatialOverlays: [
          { id: "so1", name: "Boreal Caribou Critical Habitat (BC-NCH-04)", layerType: "Wildlife", intersects: true, areaOfOverlap: 34.5 },
          { id: "so2", name: "Peace River Protected Watershed Zone", layerType: "Aquatic", intersects: true, areaOfOverlap: 12.8 },
          { id: "so3", name: "Treaty 8 Traditional Territory", layerType: "Indigenous", intersects: true, areaOfOverlap: 89.2 },
          { id: "so4", name: "Flood Zone (1:100 year)", layerType: "Hydrology", intersects: true, areaOfOverlap: 4.7 },
          { id: "so5", name: "Local Wildlife Site (Pine River Corridor)", layerType: "Wildlife", intersects: true, areaOfOverlap: 8.3 },
          { id: "so6", name: "Priority Habitat — Boreal Mixedwood", layerType: "Vegetation", intersects: true, areaOfOverlap: 22.1 },
          { id: "so7", name: "Heritage Assets Buffer Zone", layerType: "Cultural Heritage", intersects: false, areaOfOverlap: 0 },
          { id: "so8", name: "Source Protection Zone (Groundwater)", layerType: "Hydrology", intersects: true, areaOfOverlap: 6.4 },
          { id: "so9", name: "Permafrost Sensitivity Zone", layerType: "Geotechnical", intersects: true, areaOfOverlap: 15.6 },
          { id: "so10", name: "Conservation Area (Northern Boreal Reserve)", layerType: "Conservation", intersects: false, areaOfOverlap: 0 },
        ],
        contextSummary:
          "The project area contains multiple high-sensitivity features requiring detailed assessment. The proximity to caribou critical habitat and Peace River watershed elevates the environmental risk profile significantly.",
      },
    });
  },

  runImpactAnalysis: () => {
    const ctx = get().contextResult;
    if (!ctx) return;

    const statusCopy = [...get().orchestrationStatus];
    statusCopy[4] = { ...statusCopy[4], phase: AgentPhase.COMPLETE, progress: 100 };

    const impactFactors: ImpactMatrix["impactFactors"] = [
      { id: "if1", name: "Vegetation Clearing", category: "Biophysical", description: "ROW and laydown area clearing", phase: "Construction" },
      { id: "if2", name: "Watercourse Alteration", category: "Aquatic", description: "River crossing and drainage modification", phase: "Construction" },
      { id: "if3", name: "Noise & Vibration", category: "Physical", description: "Equipment and blasting noise", phase: "Construction" },
      { id: "if4", name: "Habitat Fragmentation", category: "Biophysical", description: "Linear corridor bisecting habitat", phase: "Operation" },
      { id: "if5", name: "Emissions (GHG)", category: "Atmospheric", description: "Compressor station and fugitive emissions", phase: "Operation" },
      { id: "if6", name: "Spill / Contamination", category: "Chemical", description: "Potential hydrostatic test water or fuel spill", phase: "Construction" },
      { id: "if7", name: "Land Use Disruption", category: "Socioeconomic", description: "Traditional harvesting and access restriction", phase: "Construction" },
    ];

    const vecs = ctx.vecs.filter((v) => v.selected);
    const cells: ImpactCell[] = [];

    const severityMatrix: Record<string, Record<string, string>> = {
      if1: { vec1: "moderate", vec2: "critical", vec3: "high", vec4: "high", vec5: "moderate", vec6: "low", vec7: "moderate" },
      if2: { vec1: "high", vec2: "moderate", vec3: "low", vec4: "moderate", vec5: "moderate", vec6: "none", vec7: "low" },
      if3: { vec1: "low", vec2: "high", vec3: "moderate", vec4: "moderate", vec5: "none", vec6: "low", vec7: "none" },
      if4: { vec1: "moderate", vec2: "critical", vec3: "high", vec4: "high", vec5: "low", vec6: "none", vec7: "low" },
      if5: { vec1: "low", vec2: "low", vec3: "low", vec4: "low", vec5: "none", vec6: "moderate", vec7: "high" },
      if6: { vec1: "high", vec2: "moderate", vec3: "low", vec4: "moderate", vec5: "high", vec6: "low", vec7: "low" },
      if7: { vec1: "low", vec2: "moderate", vec3: "low", vec4: "critical", vec5: "low", vec6: "none", vec7: "low" },
    };

    for (const ifactor of impactFactors) {
      for (const vec of vecs) {
        cells.push({
          impactFactorId: ifactor.id,
          vecId: vec.id,
          severity: (severityMatrix[ifactor.id]?.[vec.id] || "none") as never,
          likelihood: "probable",
          duration: "long-term",
          reversibility: "partially reversible",
          aiReasoning: `AI assessment based on project characteristics, proximity analysis, and regulatory sensitivity for ${ifactor.name} interaction with ${vec.name}.`,
          userOverride: null,
        });
      }
    }

    set({
      orchestrationStatus: statusCopy,
      impactMatrix: { impactFactors, vecs, cells },
    });
  },

  runMitigation: () => {
    const statusCopy = [...get().orchestrationStatus];
    statusCopy[5] = { ...statusCopy[5], phase: AgentPhase.COMPLETE, progress: 100 };

    set({
      orchestrationStatus: statusCopy,
      mitigationResult: {
        measures: [
          { id: "m1", impactFactorId: "if1", vecId: "vec2", title: "Reduced Operational Footprint", description: "Narrow ROW width through caribou critical habitat zones to 18m (from standard 30m) during construction.", type: "minimisation", effectiveness: "high" as never, residualImpact: "moderate" as never, source: "BC Caribou Recovery Plan", impactFactor: "Vegetation Clearing", targetVEC: "Boreal Caribou", phase: "Construction", isCustom: false },
          { id: "m2", impactFactorId: "if2", vecId: "vec1", title: "Horizontal Directional Drilling", description: "HDD crossings for both Peace River and Pine River to avoid in-stream construction and riparian disturbance.", type: "avoidance", effectiveness: "high" as never, residualImpact: "low" as never, source: "DFO Fish Habitat Guidelines", impactFactor: "Watercourse Alteration", targetVEC: "Surface Water Quality", phase: "Construction", isCustom: false },
          { id: "m3", impactFactorId: "if4", vecId: "vec2", title: "Seasonal Timing Restrictions", description: "No construction within 1km of identified caribou calving areas during May 1 - July 15.", type: "avoidance", effectiveness: "high" as never, residualImpact: "moderate" as never, source: "Federal Recovery Strategy for Woodland Caribou", impactFactor: "Habitat Fragmentation", targetVEC: "Boreal Caribou", phase: "Construction", isCustom: false },
          { id: "m4", impactFactorId: "if7", vecId: "vec4", title: "Indigenous Guardian Program", description: "Fund an Indigenous Guardian monitoring program for the life of the project to ensure traditional land use areas are respected.", type: "offset", effectiveness: "moderate" as never, residualImpact: "moderate" as never, source: "Treaty 8 Consultation Protocol", impactFactor: "Land Use Disruption", targetVEC: "First Nations Interests", phase: "Operations", isCustom: false },
          { id: "m5", impactFactorId: "if1", vecId: "vec3", title: "Pre-Construction Bird Surveys", description: "Conduct migratory bird nest surveys 48h prior to clearing. Establish 30m buffers around active nests.", type: "avoidance", effectiveness: "high" as never, residualImpact: "low" as never, source: "MBCA Best Management Practices", impactFactor: "Vegetation Clearing", targetVEC: "Migratory Birds", phase: "Pre-Construction", isCustom: false },
          { id: "m6", impactFactorId: "if5", vecId: "vec7", title: "Low-Emission Compressor Technology", description: "Install electric-drive compressors at all 3 stations to reduce direct GHG emissions by approximately 75%.", type: "minimisation", effectiveness: "high" as never, residualImpact: "low" as never, source: "ECCC GHG Reduction Guidance", impactFactor: "GHG Emissions", targetVEC: "Air Quality / Climate", phase: "Operations", isCustom: false },
          { id: "m7", impactFactorId: "if1", vecId: "vec5", title: "Progressive Reclamation Plan", description: "Implement staged reclamation of disturbed areas with native boreal seed mix within 60 days of pipe installation.", type: "rehabilitation", effectiveness: "moderate" as never, residualImpact: "low" as never, source: "BC Reclamation Standards", impactFactor: "Soil Disturbance", targetVEC: "Vegetation Communities", phase: "Post-Construction", isCustom: false },
        ],
        summary: "Seven key mitigation measures identified addressing the most significant impact pathways. HDD river crossings and seasonal timing restrictions provide the highest avoidance value.",
        gapAnalysis: [
          { impactFactorId: "if6", vecId: "vec1", description: "No specific spill response plan for hydrostatic test water discharge near fish-bearing streams.", recommendation: "Develop watercourse-specific spill response plans with DFO pre-approval." },
        ],
        residualImpacts: [
          { impactFactorId: "if1", vecId: "vec2", originalSeverity: "high" as never, residualSeverity: "moderate" as never, reduction: 40 },
          { impactFactorId: "if2", vecId: "vec1", originalSeverity: "moderate" as never, residualSeverity: "low" as never, reduction: 60 },
          { impactFactorId: "if4", vecId: "vec2", originalSeverity: "high" as never, residualSeverity: "moderate" as never, reduction: 35 },
          { impactFactorId: "if7", vecId: "vec4", originalSeverity: "moderate" as never, residualSeverity: "low" as never, reduction: 50 },
          { impactFactorId: "if1", vecId: "vec3", originalSeverity: "moderate" as never, residualSeverity: "low" as never, reduction: 55 },
          { impactFactorId: "if5", vecId: "vec7", originalSeverity: "high" as never, residualSeverity: "low" as never, reduction: 75 },
          { impactFactorId: "if1", vecId: "vec5", originalSeverity: "moderate" as never, residualSeverity: "none" as never, reduction: 90 },
        ],
      },
    });
  },

  runHistoricalComparison: () => {
    const statusCopy = [...get().orchestrationStatus];
    statusCopy[6] = { ...statusCopy[6], phase: AgentPhase.COMPLETE, progress: 100 };

    set({
      orchestrationStatus: statusCopy,
      historicalMatches: [
        {
          id: "h1",
          projectName: "Coastal GasLink Pipeline",
          projectType: "Natural Gas Pipeline",
          year: 2020,
          outcome: "Screening Required — Approved with Conditions",
          similarityScore: 0.89,
          structuralComparison: {
            componentOverlap: 0.85,
            styleConsistency: 0.78,
            lengthRatio: 0.67,
            notes: "Similar pipeline infrastructure but significantly longer at 670km. Same province and overlapping First Nations territories.",
            comparisonPhase: "project_description",
            phase1Checklist: {
              components_comparable: true,
              style_comparable: true,
              length_comparable: false,
              gaps_identified: false,
            },
          },
          impactMitigationComparison: {
            componentOverlap: 0.72,
            styleConsistency: 0.74,
            lengthRatio: 0.81,
            notes: "Impact factor overlap: 72%. Mitigation count ratio: 7 vs 9 historical.",
            comparisonPhase: "impacts_mitigation",
            phase2Checklist: {
              impacts_comparable: true,
              mitigations_comparable: true,
              style_comparable: true,
              gaps_identified: false,
            },
          },
          decisionComparison: {
            outcomeMatch: true,
            criteriaAlignment: 0.82,
            divergences: [
              "Coastal GasLink had additional LNG plant assessment bundled",
              "Different caribou herd populations affected",
            ],
            notes: "Decision criteria strongly aligned on aquatic habitat and Indigenous consultation requirements.",
          },
        },
        {
          id: "h2",
          projectName: "NGTL System Expansion",
          projectType: "Natural Gas Pipeline",
          year: 2021,
          outcome: "Screening Required — Approved with Conditions",
          similarityScore: 0.82,
          structuralComparison: {
            componentOverlap: 0.79,
            styleConsistency: 0.81,
            lengthRatio: 0.92,
            notes: "Similar scale pipeline expansion in Alberta. Comparable compressor station requirements.",
            comparisonPhase: "project_description",
            phase1Checklist: {
              components_comparable: true,
              style_comparable: true,
              length_comparable: true,
              gaps_identified: true,
            },
          },
          impactMitigationComparison: {
            componentOverlap: 0.65,
            styleConsistency: 0.79,
            lengthRatio: 0.71,
            notes: "Impact factor overlap: 65%. Mitigation count ratio: 7 vs 10 historical.",
            comparisonPhase: "impacts_mitigation",
            phase2Checklist: {
              impacts_comparable: true,
              mitigations_comparable: true,
              style_comparable: true,
              gaps_identified: true,
            },
          },
          decisionComparison: {
            outcomeMatch: true,
            criteriaAlignment: 0.76,
            divergences: [
              "Alberta regulatory framework differs from BC",
              "Less significant caribou habitat overlap",
            ],
            notes: "Good precedent for compressor station mitigation requirements.",
          },
        },
        {
          id: "h3",
          projectName: "Trans Mountain Expansion",
          projectType: "Oil Pipeline",
          year: 2019,
          outcome: "Screening Required — Approved with Conditions (Federal)",
          similarityScore: 0.71,
          structuralComparison: {
            componentOverlap: 0.62,
            styleConsistency: 0.65,
            lengthRatio: 0.45,
            notes: "Significantly larger project (oil vs gas) but similar BC terrain and Indigenous consultation approach.",
            comparisonPhase: "project_description",
            phase1Checklist: {
              components_comparable: true,
              style_comparable: true,
              length_comparable: false,
              gaps_identified: true,
            },
          },
          impactMitigationComparison: {
            componentOverlap: 0.48,
            styleConsistency: 0.61,
            lengthRatio: 0.55,
            notes: "Impact factor overlap: 48%. Mitigation count ratio: 7 vs 14 historical. Oil spill pathway not present.",
            comparisonPhase: "impacts_mitigation",
            phase2Checklist: {
              impacts_comparable: false,
              mitigations_comparable: true,
              style_comparable: true,
              gaps_identified: true,
            },
          },
          decisionComparison: {
            outcomeMatch: true,
            criteriaAlignment: 0.68,
            divergences: [
              "Oil product risk profile very different from natural gas",
              "Marine terminal component has no analogue",
              "Much more extensive Indigenous consultation required",
            ],
            notes: "Useful as upper-bound precedent for Indigenous consultation scope.",
          },
        },
      ],
    });
  },

  runConsistencyValidation: () => {
    const statusCopy = [...get().orchestrationStatus];
    statusCopy[7] = { ...statusCopy[7], phase: AgentPhase.COMPLETE, progress: 100 };

  set({
  orchestrationStatus: statusCopy,
  consistencyReport: {
  overallScore: 0.84,
  impactRatingsAlignment: 0.87,
  mitigationAlignment: 0.79,
  recommendationAlignment: 0.91,
  gaps: [
          {
            id: "g1",
            section: "Mitigation",
            description: "No spill response plan for hydrostatic test water near fish-bearing streams",
            severity: "high" as never,
            suggestedFix: "Develop watercourse-specific spill response plans with DFO pre-approval.",
          },
          {
            id: "g2",
            section: "Context",
            description: "Permafrost assessment incomplete for northern sections of the ROW",
            severity: "moderate" as never,
            suggestedFix: "Commission geotechnical investigation for km 80-120 segment.",
          },
        ],
        deviations: [
          {
            id: "d1",
            section: "Impact Matrix",
            description: "Caribou impact rated 'Critical' where comparable projects rated 'High'",
            historicalNorm: "High severity",
            currentValue: "Critical severity",
            severity: "low" as never,
          },
        ],
        recommendations: [
          "Address the spill response plan gap before finalizing the report.",
          "Consider commissioning the northern permafrost assessment.",
          "The elevated caribou rating is justified given updated recovery strategy data and should be retained.",
        ],
      },
    });
  },

  generateReport: () => {
    const statusCopy = [...get().orchestrationStatus];
    statusCopy[8] = { ...statusCopy[8], phase: AgentPhase.COMPLETE, progress: 100 };

    set({
      orchestrationStatus: statusCopy,
      report: {
        id: "rpt_001",
        projectId: get().project?.id || "",
        title: "EIA Screening Report — Northern Expansion Pipeline Project",
        sections: [
          // ── Section 1: Introduction ──
          {
            id: "s1",
            title: "1. Introduction & Purpose",
            content:
              "This Environmental Impact Assessment (EIA) Screening Report has been prepared by WSP on behalf of Northern Energy Corp. to assess whether the Northern Expansion Pipeline Project requires a full Impact Assessment under the Impact Assessment Act (2019) and the Physical Activities Regulations (SOR/2019-285).\n\nThe purpose of this report is to:\n- Describe the nature and location of the Project;\n- Identify the environmental sensitivity of the geographical area;\n- Consider the likely significant effects on the environment;\n- Determine whether the Project should be subject to a full EIA.\n\nAll information has been collated from desk-based sources, field surveys, geospatial analyses, and regulatory databases. Where available, emerging information from ongoing environmental assessments has been incorporated.",
            sources: [
              { id: "src1", type: "regulation", reference: "Impact Assessment Act (2019), Schedule s. 43", excerpt: "Pipeline threshold criteria" },
              { id: "src1b", type: "regulation", reference: "Physical Activities Regulations SOR/2019-285", excerpt: "Designated project list for gas pipelines" },
            ],
            order: 1,
            isEdited: false,
          },
          // ── Section 2: Project Site & Description ──
          {
            id: "s2",
            title: "2. Project Site & Description",
            content:
              "2.1 Project Site\nThe Project is located in northeast British Columbia, within the Northern Boreal ecoregion. The pipeline corridor extends approximately 120km from the Dawson Creek processing facility (55.9692\u00B0N, 120.2353\u00B0W) to the Prince Rupert LNG terminal (54.3150\u00B0N, 130.3208\u00B0W). The site traverses Treaty 8 First Nations traditional territory (89.2 km\u00B2 overlap), Boreal Caribou Critical Habitat polygon BC-NCH-04 (34.5 km\u00B2 overlap), and two major watercourse crossings at Peace River and Pine River.\n\nThe pipeline right-of-way (ROW) is 60m wide within a corridor that encompasses boreal mixedwood forest, wetlands, permafrost terrain, and agricultural land. The project area does not fall within any National Park or designated Protected Area, but lies adjacent to the Northern Boreal Conservation Area.\n\n2.2 Need for the Project\nNorthern Energy Corp. requires a new natural gas transmission pipeline to connect production areas with the LNG export terminal. Existing infrastructure is at capacity, and demand projections indicate a requirement for additional transmission capacity by 2028.\n\n2.3 Description of the Project\nThe Project comprises the following principal elements:\n\u2022 120-kilometre, 36-inch diameter natural gas transmission pipeline\n\u2022 Three compressor stations (CS-01 Dawson Creek, CS-02 Pine River, CS-03 Summit Lake)\n\u2022 Two river crossings via Horizontal Directional Drilling (HDD) at Peace River and Pine River\n\u2022 Metering stations and valve sites\n\u2022 Approximately 45km of temporary access roads\n\u2022 Construction duration: 24 months\n\n2.4 Access\nConstruction access will utilise existing forestry service roads where available, supplemented by temporary access roads. Primary supply routes connect via Highway 97 and Highway 29.",
            sources: [
              { id: "src2", type: "ai_generated", reference: "Extracted from intake documentation", excerpt: "Project description, Sections 1-3" },
              { id: "src2b", type: "library", reference: "BC GeoData Catalogue — Road Network", excerpt: "Forestry service road inventory" },
            ],
            order: 2,
            isEdited: false,
          },
          // ── Section 3: EIA Screening Assessment ──
          {
            id: "s3",
            title: "3.1 Regulatory Framework & Threshold Analysis",
            content:
              "The project has been assessed against the Impact Assessment Act (2019) and the Physical Activities Regulations (SOR/2019-285). Three regulatory thresholds are triggered:\n\n1. Pipeline Length Threshold (96% confidence)\nAt 120km, the pipeline significantly exceeds the 40km threshold under SOR/2019-285, s. 18(a) for natural gas pipelines.\n\n2. Watercourse Crossing (91% confidence)\nPeace River is classified as a navigable waterway. Two river crossings are identified, including Peace River which is classified as a navigable waterway under IAA s. 43(b).\n\n3. Indigenous Territory (94% confidence)\nThe project traverses Treaty 8 territory and is proximate to West Moberly First Nations traditional land use areas under IAA s. 7(e).\n\nScreening Determination: SCREENING REQUIRED — The project is a Designated Project under SOR/2019-285 and triggers multiple provisions of the IAA.",
            sources: [
              { id: "src3", type: "regulation", reference: "Physical Activities Regulations SOR/2019-285", excerpt: "Section 18(a) — natural gas pipeline threshold" },
              { id: "src4", type: "regulation", reference: "IAA s. 43(b), s. 7(e)", excerpt: "Navigable waterway and Indigenous considerations" },
            ],
            order: 3,
            isEdited: false,
          },
          {
            id: "s4",
            title: "3.2 Geospatial Analysis & Environmental Constraints",
            content:
              "Spatial overlay analysis was conducted using 10 GIS data layers against the project footprint (120km corridor, 60m ROW buffer). Project centroid: 55.7596\u00B0N, 120.2353\u00B0W.\n\nLayers with intersection:\n\u2022 Boreal Caribou Critical Habitat (BC-NCH-04): 34.5 km\u00B2 overlap\n\u2022 Peace River Protected Watershed Zone: 12.8 km\u00B2 overlap at HDD crossings\n\u2022 Treaty 8 Traditional Territory: 89.2 km\u00B2 (full corridor)\n\u2022 Flood Zone (1:100 year): 4.7 km\u00B2 near Pine River confluence\n\u2022 Local Wildlife Site (Pine River Corridor): 8.3 km\u00B2 overlap\n\u2022 Priority Habitat — Boreal Mixedwood: 22.1 km\u00B2 overlap\n\u2022 Source Protection Zone (Groundwater): 6.4 km\u00B2 near CS-02\n\u2022 Permafrost Sensitivity Zone: 15.6 km\u00B2 along northern segment\n\nLayers with no intersection:\n\u2022 Heritage Assets Buffer Zone: No overlap\n\u2022 Conservation Area (Northern Boreal Reserve): No overlap\n\nTotal spatial footprint with environmental constraints: 193.6 km\u00B2 across 8 of 10 screened layers. Environmental Constraints Map (Figure 2) and Site Location Plan (Figure 1) are appended.",
            sources: [
              { id: "src_geo1", type: "library", reference: "Federal Critical Habitat Map 2024", excerpt: "BC-NCH-04 caribou polygon" },
              { id: "src_geo2", type: "library", reference: "BC Water Atlas — Protected Watershed Zones", excerpt: "Peace River classification" },
              { id: "src_geo3", type: "library", reference: "BC Flood Hazard Map (1:100yr)", excerpt: "Pine River confluence zone" },
              { id: "src_geo4", type: "ai_generated", reference: "Geospatial Analysis Engine v2.1", excerpt: "10-layer overlay analysis" },
            ],
            order: 4,
            isEdited: false,
          },
          {
            id: "s5",
            title: "3.3 Ecology & Biodiversity",
            content:
              "Will the project affect ecologically sensitive areas or protected species?\n\nThe pipeline corridor intersects 34.5 km\u00B2 of federally designated Boreal Caribou Critical Habitat (Southern Mountain population, SARA Schedule 1 — Threatened). Caribou recovery strategies identify this as a high-priority zone with 65% habitat disturbance already. The proposed corridor would increase linear disturbance density by an estimated 0.4 km/km\u00B2.\n\nThe Pine River Corridor Local Wildlife Site (8.3 km\u00B2) provides nesting habitat for migratory bird species protected under the Migratory Birds Convention Act. Seasonal restrictions (April 15 to August 15) would apply to construction within this zone.\n\nBoreal Mixedwood priority habitat (22.1 km\u00B2) includes mature stands >120 years with high biodiversity value. Vegetation clearing would require pre-construction rare plant surveys.\n\nIs a Significant Effect Likely?\nYes — significant effects likely. Caribou habitat fragmentation and increased predator access along the linear corridor represent significant residual effects after mitigation. A full Impact Assessment is warranted for ecology.",
            sources: [
              { id: "src5a", type: "library", reference: "Federal Recovery Strategy for Woodland Caribou (2024)", excerpt: "Southern Mountain population — habitat disturbance thresholds" },
              { id: "src5b", type: "library", reference: "Migratory Birds Convention Act", excerpt: "Nesting season restrictions" },
              { id: "src5c", type: "library", reference: "BC Conservation Data Centre", excerpt: "Species at risk records within corridor" },
            ],
            order: 5,
            isEdited: false,
          },
          {
            id: "s6",
            title: "3.4 Water Resources & Flood Risk",
            content:
              "Will the project affect watercourses, groundwater or flood risk?\n\nThe project proposes two major watercourse crossings:\n\u2022 Peace River (HDD crossing, ~400m span) — classified as a navigable waterway under the Canadian Navigable Waters Act. Peace River Protected Watershed Zone overlap of 12.8 km\u00B2.\n\u2022 Pine River (HDD crossing, ~200m span) — confluence with Peace River lies within Flood Zone (1:100 year), 4.7 km\u00B2 intersection.\n\nSource Protection Zone (Groundwater) overlap of 6.4 km\u00B2 near compressor station CS-02. HDD technique avoids direct waterbed disturbance but drilling fluid release (frac-out) remains a residual risk.\n\nA Water Framework Directive screening assessment confirms potential effects on water quality during construction from suspended sediments, hydrocarbon spills, and drilling fluid release. Mitigation through the Construction Environmental Management Plan (CEMP) and HDD Contingency Plan would manage the majority of risks.\n\nIs a Significant Effect Likely?\nModerate — with HDD crossings and CEMP implementation, residual effects on surface water quality are not anticipated to be significant. However, the scale of crossing and proximity to protected watershed zones requires detailed assessment as part of the full IA.",
            sources: [
              { id: "src6a", type: "regulation", reference: "Canadian Navigable Waters Act", excerpt: "Peace River — navigable waterway classification" },
              { id: "src6b", type: "library", reference: "BC Flood Hazard Map (1:100yr)", excerpt: "Pine River confluence flood zone" },
              { id: "src6c", type: "library", reference: "BC Water Atlas — Source Protection Zones", excerpt: "Groundwater SPZ near CS-02" },
            ],
            order: 6,
            isEdited: false,
          },
          {
            id: "s7",
            title: "3.5 Indigenous Peoples & Cultural Heritage",
            content:
              "Will the project affect Indigenous peoples, their rights, or cultural heritage?\n\nThe project traverses Treaty 8 First Nations traditional territory (89.2 km\u00B2 full corridor overlap). Key considerations:\n\u2022 West Moberly First Nations and Saulteau First Nations have identified traditional land use areas for hunting, harvesting, and cultural practices within 5km of the corridor.\n\u2022 Treaty 8 Sacred Site identified 1.2km from proposed ROW centreline — traditional gathering and ceremonial site identified through community consultation.\n\u2022 Section 35 of the Constitution Act (1982) requires meaningful consultation with Indigenous groups on projects that may affect Aboriginal and treaty rights.\n\u2022 IAA s. 22(1)(c) requires consideration of impacts on Indigenous peoples' health, social and economic conditions, cultural heritage, and lands/resources.\n\nHeritage Assets Buffer Zone shows no direct intersection, but the proximity of cultural sites requires an Archaeological Impact Assessment and a Heritage Resources Impact Assessment.\n\nIs a Significant Effect Likely?\nYes — significant effects likely. The full corridor traverses Treaty 8 territory, and meaningful consultation under Crown duty is required. Traditional land use disruption during construction and operation represents a significant residual effect requiring full Impact Assessment.",
            sources: [
              { id: "src7a", type: "regulation", reference: "IAA s. 22(1)(c)", excerpt: "Indigenous impacts consideration requirement" },
              { id: "src7b", type: "regulation", reference: "Constitution Act (1982) s. 35", excerpt: "Crown duty to consult" },
              { id: "src7c", type: "library", reference: "Treaty 8 Traditional Land Use Study (2023)", excerpt: "Harvesting and cultural practice areas" },
            ],
            order: 7,
            isEdited: false,
          },
          {
            id: "s8",
            title: "3.6 Air Quality, Noise & Climate",
            content:
              "Will the project cause emissions to air, noise, or contribute to greenhouse gas emissions?\n\nAir Quality:\nCompressor stations CS-01, CS-02, CS-03 will emit NOx, CO, and particulate matter during operation. Construction dust (PM10, PM2.5) generation anticipated during pipeline trenching and access road construction. Background air quality in the Northern Boreal region is generally good, with concentrations well below CCME ambient air quality objectives.\n\nNoise:\nConstruction noise from trenching equipment, HDD rigs, and compressor station construction will be temporary (24 months). Nearest sensitive receptors (West Moberly community) are approximately 3km from the corridor. Operational noise from compressor stations will be assessed against BC OGC guidelines. Acoustic enclosures are proposed for all compressor units.\n\nGreenhouse Gas Emissions:\nConstruction and operational GHG contributions have been estimated at 85,000 tonnes CO2e/year during operation (fugitive methane, compressor fuel gas). The project falls under the BC Greenhouse Gas Industrial Reporting and Control Act reporting thresholds.\n\nIs a Significant Effect Likely?\nNo significant air quality or noise effects anticipated with standard mitigation. GHG emissions require quantification and reporting under provincial requirements but are not anticipated to be significant at the project level.",
            sources: [
              { id: "src8a", type: "regulation", reference: "CCME Ambient Air Quality Objectives", excerpt: "NOx, PM2.5, PM10 thresholds" },
              { id: "src8b", type: "regulation", reference: "BC OGC Noise Control Guidelines", excerpt: "Compressor station operational limits" },
              { id: "src8c", type: "regulation", reference: "IAA s. 22(1)(i)", excerpt: "GHG considerations in impact assessment" },
            ],
            order: 8,
            isEdited: false,
          },
          {
            id: "s9",
            title: "3.7 Land, Soils & Geotechnical",
            content:
              "Will the project affect topography, soils, or geotechnical conditions?\n\nThe pipeline corridor crosses Permafrost Sensitivity Zone (15.6 km\u00B2) along the northern segment. Climate change-driven permafrost thaw presents long-term geotechnical risks to pipeline integrity. Geotechnical investigation is recommended for the northern 35km segment.\n\nSoil disturbance during trenching (120km x 60m ROW) will affect approximately 720 hectares. Soil conservation plans including topsoil segregation and revegetation programs are standard mitigation. No SSSI, SAC, SPA or Geological Conservation Review sites are located within 250m of the corridor.\n\nArtificial ground and previously disturbed land is limited; the majority of the corridor crosses undisturbed boreal terrain.\n\nIs a Significant Effect Likely?\nModerate — permafrost sensitivity requires detailed geotechnical assessment. Standard soil conservation measures will mitigate construction-phase effects. No significant long-term effects anticipated with appropriate pipeline design for permafrost conditions.",
            sources: [
              { id: "src9a", type: "library", reference: "BC Permafrost Hazard Map (2024)", excerpt: "Sensitivity classification — northern segment" },
              { id: "src9b", type: "ai_generated", reference: "Geotechnical Risk Assessment", excerpt: "Climate-adjusted permafrost thaw projections" },
            ],
            order: 9,
            isEdited: false,
          },
          // ── Section 4: Impact Assessment Summary ──
          {
            id: "s10",
            title: "4. Impact Assessment Matrix Summary",
            content:
              "The impact factor vs. VEC matrix identifies 49 interaction cells across 7 impact factors and 7 VECs.\n\nCritical Impacts (requiring full IA):\n\u2022 Vegetation Clearing \u00d7 Boreal Caribou — Habitat loss in critical habitat zone\n\u2022 Habitat Fragmentation \u00d7 Boreal Caribou — Increased predator access along linear corridor\n\u2022 Land Use Disruption \u00d7 Traditional Land Use — Treaty 8 territory, harvesting disruption\n\nHigh Impacts:\n\u2022 Watercourse Alteration \u00d7 Surface Water Quality — HDD crossing risks\n\u2022 Spill/Contamination Risk \u00d7 Surface Water Quality — Construction-phase hydrocarbon risk\n\u2022 Vegetation Clearing \u00d7 Migratory Birds — Nesting habitat loss\n\u2022 Noise/Vibration \u00d7 Boreal Caribou — Sensory disturbance during calving\n\u2022 Land Use Disruption \u00d7 Surface Water Quality — Erosion and sedimentation\n\nModerate Impacts: 14 cells identified\nLow/Negligible Impacts: 25 cells identified\n\nOverall matrix severity: HIGH — Multiple critical and high-impact interactions require detailed assessment beyond the screening level.",
            sources: [
              { id: "src10", type: "ai_generated", reference: "Impact Matrix Analysis", excerpt: "7x7 matrix with 2 critical, 8 high, 14 moderate interactions" },
            ],
            order: 10,
            isEdited: false,
          },
          // ── Section 5: Mitigation & Historical Precedent ──
          {
            id: "s11",
            title: "5. Mitigation Measures & Residual Effects",
            content:
              "Seven key mitigation measures have been identified across the avoidance-minimisation-offset hierarchy:\n\nAvoidance:\n\u2022 HDD crossings at Peace River and Pine River to avoid direct waterbed disturbance\n\u2022 Seasonal timing restrictions (April 15 — August 15) for caribou calving and migratory bird nesting\n\u2022 ROW routing to avoid Treaty 8 sacred site (1.2km buffer maintained)\n\nMinimisation:\n\u2022 Reduced operational footprint (40m construction ROW narrowing to 18m permanent ROW)\n\u2022 Low-emission compressor technology with acoustic enclosures\n\u2022 Topsoil segregation and native seed revegetation program\n\nOffset:\n\u2022 Indigenous Guardian monitoring program with West Moberly and Saulteau First Nations\n\u2022 Caribou habitat restoration contribution fund\n\nIdentified Gap:\nWatercourse-specific spill response planning requires DFO pre-approval. Contingency plan for HDD frac-out at Peace River crossing requires detailed development.",
            sources: [
              { id: "src11a", type: "library", reference: "BC Caribou Recovery Plan", excerpt: "ROW width reduction guidance" },
              { id: "src11b", type: "library", reference: "DFO Fish Habitat Guidelines", excerpt: "HDD crossing requirements" },
            ],
            order: 11,
            isEdited: false,
          },
          {
            id: "s12",
            title: "6. Historical Precedent Analysis",
            content:
              "Three comparable projects have been analysed for precedent guidance:\n\n1. Coastal GasLink Pipeline (89% similarity)\n670km gas pipeline in northeast BC. Required screening and approved with 43 conditions. Decision Statement 2020. Key condition: caribou habitat monitoring program (Condition 4.2).\n\n2. NGTL System Expansion (82% similarity)\n305km pipeline expansion in Alberta/BC. Screening required, approved with conditions. Decision 2021. Key condition: compressor station emission requirements.\n\n3. Trans Mountain Expansion (71% similarity)\n980km crude oil pipeline. Full IA required and completed. Approved with 156 conditions. Lower similarity due to product type (crude vs. natural gas) but relevant for watercourse crossing and Indigenous consultation precedents.\n\nDecision criteria alignment ranges from 68% to 82%. All three projects required screening and were approved with conditions. The elevated caribou severity rating in this assessment is justified by updated 2024 recovery strategy data showing further habitat decline since the Coastal GasLink decision.",
            sources: [
              { id: "src12a", type: "historical", reference: "Coastal GasLink Decision Statement 2020", excerpt: "Condition 4.2 — caribou habitat monitoring" },
              { id: "src12b", type: "historical", reference: "NGTL Expansion Decision 2021", excerpt: "Compressor station emission requirements" },
              { id: "src12c", type: "historical", reference: "Trans Mountain Decision 2016/2019", excerpt: "Watercourse and Indigenous consultation conditions" },
            ],
            order: 12,
            isEdited: false,
          },
          // ── Section 7: Conclusion & Recommendation ──
          {
            id: "s13",
            title: "7. Conclusion & Recommendation",
            content:
              "This EIA Screening Report has assessed the Northern Expansion Pipeline Project against the Impact Assessment Act (2019), the Physical Activities Regulations (SOR/2019-285), and Schedule 3 environmental sensitivity criteria.\n\nKey findings:\n\u2022 Three regulatory thresholds are triggered (pipeline length, navigable waterway crossing, Indigenous territory)\n\u2022 Geospatial analysis identified intersection with 8 of 10 environmental constraint layers (193.6 km\u00B2 total)\n\u2022 Significant effects are likely for Ecology & Biodiversity (caribou habitat) and Indigenous Peoples & Cultural Heritage (Treaty 8 territory)\n\u2022 Moderate effects identified for Water Resources (HDD crossing risks) and Land & Soils (permafrost sensitivity)\n\u2022 No significant effects anticipated for Air Quality, Noise, or Cultural Heritage (built heritage)\n\u2022 Impact matrix identifies 2 critical and 8 high-impact interactions across 7 VECs\n\u2022 Historical precedent confirms all three comparable projects required screening with conditions\n\nDetermination: The Northern Expansion Pipeline Project IS considered a Designated Project requiring a full Impact Assessment under the IAA.\n\nConditions for proceeding to full IA:\n1. Develop watercourse-specific spill response plans (DFO pre-approval required)\n2. Commission northern segment permafrost geotechnical investigation\n3. Initiate Crown consultation with Treaty 8 First Nations under s. 35 Constitution Act\n\nOverall consistency score: 84% (2 gaps, 1 deviation from historical precedent identified by AI validation).",
            sources: [
              { id: "src13a", type: "ai_generated", reference: "Consistency Validation Report", excerpt: "Overall score: 84% — 2 gaps, 1 deviation" },
              { id: "src13b", type: "regulation", reference: "IAA s. 16(1)", excerpt: "Designation decision criteria" },
            ],
            order: 13,
            isEdited: false,
          },
          // ── Appendices reference ──
          {
            id: "s14",
            title: "Appendices",
            content:
              "The following figures and supplementary materials are appended to this report:\n\n\u2022 Figure 1: Site Location Plan — Pipeline corridor overview with grid references and key infrastructure locations\n\u2022 Figure 2: Environmental Constraints Map — GIS overlay showing all 10 screened data layers, intersection areas, and buffer zones\n\u2022 Figure 3: Proposed Pipeline Layout — Detailed alignment, compressor station locations, HDD crossing points, and access roads\n\u2022 Appendix A: Regulatory Threshold Assessment Details\n\u2022 Appendix B: Spatial Overlay Analysis — Full GIS methodology and layer metadata\n\u2022 Appendix C: Impact Factor x VEC Matrix (full 7x7 grid with severity ratings)\n\u2022 Appendix D: Historical Precedent Comparison Tables\n\u2022 Appendix E: Audit Trail and AI Confidence Scores",
            sources: [],
            order: 14,
            isEdited: false,
          },
        ],
        auditTrail: [
          { id: "a1", timestamp: new Date().toISOString(), action: "Report Generated", actor: "AI Orchestrator", section: "All", previousValue: "", newValue: "Initial draft generated" },
        ],
        generatedAt: new Date().toISOString(),
        status: "draft",
      },
    });
  },

  updateReportSection: (sectionId: string, newContent: string) => {
    const report = get().report;
    if (!report) return;

    const updatedSections = report.sections.map((s) =>
      s.id === sectionId
        ? { ...s, content: newContent, isEdited: true }
        : s
    );

    const sectionTitle = report.sections.find((s) => s.id === sectionId)?.title || sectionId;
    const previousContent = report.sections.find((s) => s.id === sectionId)?.content || "";

    const newAuditEntry = {
      id: `a${report.auditTrail.length + 1}`,
      timestamp: new Date().toISOString(),
      action: "Section Edited",
      actor: "User",
      section: sectionTitle,
      previousValue: previousContent.slice(0, 80) + (previousContent.length > 80 ? "..." : ""),
      newValue: newContent.slice(0, 80) + (newContent.length > 80 ? "..." : ""),
    };

    set({
      report: {
        ...report,
        sections: updatedSections,
        auditTrail: [...report.auditTrail, newAuditEntry],
      },
    });
  },

  updateProjectType: (typeId: string) => {
    const project = get().project;
    if (!project) return;
    const config = PROJECT_TYPES_LIBRARY.find((t) => t.id === typeId);
    if (!config) return;

    const updated: ProjectData = {
      ...project,
      projectType: config.name,
      projectTypeId: config.id,
      projectSubtype: config.subtype,
      projectSizeUnit: config.sizeUnit,
      bufferDistanceKm: config.bufferDistanceKm,
      components: config.standardComponents,
      physicalActivities: config.standardActivities,
      updatedAt: new Date().toISOString(),
    };
    set({ project: updated });
    get().recalcCompleteness();
  },

  updateProjectSize: (size: number | null) => {
    const project = get().project;
    if (!project) return;
    set({ project: { ...project, projectSize: size, updatedAt: new Date().toISOString() } });
    get().recalcCompleteness();
  },

  updateProjectComponents: (components: string[]) => {
    const project = get().project;
    if (!project) return;
    set({ project: { ...project, components, updatedAt: new Date().toISOString() } });
    get().recalcCompleteness();
  },

  updateProjectLocation: (lat: number, lng: number) => {
    const project = get().project;
    if (!project) return;
    set({
      project: {
        ...project,
        location: { ...project.location, coordinates: { lat, lng } },
        updatedAt: new Date().toISOString(),
      },
    });
    get().recalcCompleteness();
  },

recalcCompleteness: () => {
  const project = get().project;
  if (!project) return;
  
  const checks = [
  { weight: 15, done: !!project.name },
  { weight: 15, done: !!project.projectTypeId },
  { weight: 15, done: !!project.proponent },
  { weight: 15, done: !!project.location.coordinates },
  { weight: 10, done: project.projectSize !== null && project.projectSize > 0 },
  { weight: 15, done: project.components.length > 0 },
  { weight: 15, done: project.physicalActivities.length > 0 },
  ];
  
  const completeness = checks.reduce((sum, c) => sum + (c.done ? c.weight : 0), 0);
  set({ project: { ...project, completeness } });
  },

  updateExtractedField: (fieldIndex: number, newValue: string) => {
    const project = get().project;
    if (!project) return;
    
    const updatedFields = [...project.extractedFields];
    if (updatedFields[fieldIndex]) {
      updatedFields[fieldIndex] = {
        ...updatedFields[fieldIndex],
        userOverride: newValue,
      };
    }
    
    set({ project: { ...project, extractedFields: updatedFields } });
  },
  }));
