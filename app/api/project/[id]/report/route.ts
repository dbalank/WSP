import { NextResponse } from "next/server";

/**
 * POST /api/project/:id/report
 * Returns a mock screening report.
 */
export async function POST() {
  return NextResponse.json({
    report: {
      id: "rpt_001",
      project_id: "proj_001",
      title: "Environmental Impact Screening Report: Northern Expansion Pipeline Project",
      status: "draft",
      generated_at: new Date().toISOString(),
      sections: [
        {
          id: "sec_1",
          title: "Executive Summary",
          order: 1,
          content: "This report presents the environmental impact screening assessment for the Northern Expansion Pipeline Project, proposed by Northern Energy Corp. in British Columbia.\n\nLegal threshold analysis determined: SCREENING REQUIRED. The project triggers physical activity thresholds under the Impact Assessment Act with a pipeline exceeding 75km.\n\nThe impact assessment identified 3 critical interactions requiring attention, primarily related to water crossings and caribou habitat impacts.\n\nConsistency validation score: 82%.",
          sources: [
            { id: "src_1", source_type: "ai_generated", reference: "AI Summary Engine", excerpt: "Generated from project data and analysis results." },
          ],
        },
        {
          id: "sec_2",
          title: "Project Description",
          order: 2,
          content: "Northern Expansion Pipeline Project\n\nThe project involves the construction and operation of a 120km natural gas pipeline through the Northern Interior region of British Columbia.\n\nProponent: Northern Energy Corp.\nLocation: British Columbia, Northern Region\nProject Type: Natural Gas Pipeline\n\nPhysical Activities:\n  - Land clearing\n  - Excavation & grading\n  - Pipeline installation\n  - Water crossings (4 major)\n  - Compressor station construction\n\nComponents:\n  - Main pipeline (120km, 36-inch diameter)\n  - 2 compressor stations\n  - Access roads (45km new, 80km upgraded)\n  - Temporary construction camps (3)",
          sources: [
            { id: "src_2", source_type: "project_intake", reference: "Project Intake Data", excerpt: "Extracted from project description." },
          ],
        },
        {
          id: "sec_3",
          title: "Legal Threshold Analysis",
          order: 3,
          content: "Project Type: Natural Gas Pipeline\nOverall Outcome: SCREENING REQUIRED\n\nThreshold Evaluations:\n  - Physical Activity Threshold: TRIGGERED (Confidence: 92%)\n    Pipeline length exceeds 75km threshold under the Physical Activities Regulations.\n  - Provincial Environmental Assessment: TRIGGERED (Confidence: 88%)\n    Project is reviewable under the BC Environmental Assessment Act.\n  - Species at Risk Trigger: Not triggered (Confidence: 65%)\n    No confirmed critical habitat overlap at this stage.\n\nReasoning: The project triggers both federal and provincial assessment thresholds due to its physical scale and geographic footprint.",
          sources: [
            { id: "src_3", source_type: "regulation", reference: "IAA Schedule, Part 1, Section 1(a)", excerpt: "Designated Physical Activities Regulations." },
          ],
        },
        {
          id: "sec_4",
          title: "Environmental Context",
          order: 4,
          content: "Sensitive Areas:\n  - Caribou Habitat Zone A (wildlife): HIGH severity, 2.3km from project\n  - Fraser River Watershed (water): CRITICAL severity, 0.5km from project\n  - First Nations Reserve Lands (indigenous): HIGH severity, 4.1km from project\n  - Wetland Complex B-14 (water): MODERATE severity, 1.8km from project\n\nSelected VECs:\n  - Surface Water Quality (water): 95% relevance\n  - Fish Habitat (aquatic): 92% relevance\n  - Caribou Populations (terrestrial): 88% relevance\n  - Indigenous Land Use (social): 85% relevance\n  - Air Quality (atmospheric): 72% relevance\n  - Wetland Ecosystems (water): 78% relevance\n\nSummary: The project area contains several highly sensitive environmental features including SARA-listed caribou habitat, salmon spawning areas, and First Nations traditional territory.",
          sources: [
            { id: "src_4", source_type: "geospatial", reference: "Geospatial Analysis Engine", excerpt: "Spatial overlay results." },
          ],
        },
        {
          id: "sec_5",
          title: "Impact Assessment Matrix",
          order: 5,
          content: "Impact Matrix: 6 factors x 6 VECs = 36 interactions assessed.\n\nCritical impacts: 3\n  - Water Crossing x Surface Water: Critical\n  - Water Crossing x Fish Habitat: Critical\n  - Water Crossing x Wetlands: Critical\n\nHigh impacts: 7\n  - Land Clearing x Fish Habitat: High\n  - Land Clearing x Caribou: High (critical habitat fragmentation risk)\n  - Land Clearing x Indigenous Use: High\n  - Land Clearing x Wetlands: High\n  - Excavation x Surface Water: High\n  - Excavation x Wetlands: High\n  - Vehicle Traffic x Caribou: High\n\nTotal significant interactions: 10 of 36 (28%)",
          sources: [
            { id: "src_5", source_type: "ai_generated", reference: "Impact Analysis Engine", excerpt: "AI-assessed severity ratings." },
          ],
        },
        {
          id: "sec_6",
          title: "Mitigation Measures",
          order: 6,
          content: "Total measures: 7\n\nKey Measures:\n  - Sediment and Erosion Control Plan (preventive, high effectiveness)\n  - Wildlife Movement Corridor Preservation (compensatory, high effectiveness)\n  - Aquatic Habitat Compensation at 2:1 ratio (compensatory, high effectiveness)\n  - Indigenous Community Engagement Protocol (preventive, high effectiveness)\n  - Air Quality Management Plan (preventive, moderate effectiveness)\n  - Spill Prevention and Response (reactive, high effectiveness)\n  - Wetland Avoidance and Setback Protocol (preventive, moderate effectiveness)\n\nGaps: 1\n  - Water Crossing x Wetland Ecosystems: No standard mitigation. Project-specific measures needed (recommend HDD).\n\nOverall mitigation coverage: 85% of significant impacts addressed.",
          sources: [
            { id: "src_6", source_type: "library", reference: "Mitigation Library", excerpt: "Standard mitigation measures." },
          ],
        },
        {
          id: "sec_7",
          title: "Conclusions and Recommendations",
          order: 7,
          content: "Based on the comprehensive assessment:\n\n1. The project requires full environmental impact assessment under both federal (IAA) and provincial (BC EAA) legislation.\n2. 7 mitigation measures have been identified from the standard library.\n3. 1 mitigation gap requires project-specific attention (wetland crossing methodology).\n4. Overall consistency with historical screening practices: 82%.\n5. The project is recommended to proceed to detailed EIA with particular attention to caribou habitat offsets, fish habitat compensation, and wetland crossing design.\n\nNext Steps:\n  - Develop project-specific wetland crossing mitigation (HDD recommended)\n  - Initiate formal Section 35 consultation with Lheidli Tenneh Nation\n  - Commission detailed caribou habitat assessment for winter range impacts\n  - Prepare federal IA application under the Impact Assessment Act",
          sources: [
            { id: "src_7", source_type: "ai_generated", reference: "AI Conclusions Engine", excerpt: "Synthesised from all analyses." },
          ],
        },
      ],
      audit_trail: [
        {
          id: "audit_1",
          timestamp: new Date().toISOString(),
          action: "Report Generated",
          actor: "EIA Agent Framework",
          section: "All",
          previous_value: "",
          new_value: "Initial report generation from workflow pipeline.",
        },
      ],
    },
  });
}
