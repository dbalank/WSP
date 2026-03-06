"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  ExternalLink,
  BookOpen,
  Scale,
  History,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

interface SourcePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: {
    type: "regulation" | "library" | "historical" | "ai_generated" | "document";
    reference: string;
    title?: string;
    section?: string;
    excerpt: string;
    url?: string;
  } | null;
}

// Mock document excerpts for different source types
const SOURCE_EXCERPTS: Record<string, { title: string; section: string; text: string; url?: string }> = {
  "IAA Schedule 2019": {
    title: "Impact Assessment Act - Schedule",
    section: "Physical Activities Requiring Assessment",
    text: `The following physical activities are designated activities for the purposes of the Act:

**Oil and Gas Pipelines**
A new oil or gas pipeline that requires a total of more than 75 kilometres of new right of way.

**Transmission Lines**
A new international or interprovincial electrical transmission line with a voltage of 345 kV or more that requires a total of more than 75 kilometres of new right of way in a province.

The designated activities listed above are subject to impact assessment requirements under the Impact Assessment Act (IAA) when they meet the specified thresholds.`,
    url: "https://laws-lois.justice.gc.ca/eng/acts/I-2.75/page-14.html",
  },
  "BCEAA Reviewable Projects": {
    title: "BC Environmental Assessment Act - Reviewable Projects Regulation",
    section: "Part 4 - Energy Projects",
    text: `**4.1 Transmission Lines**
A reviewable project is a project that includes the construction of:
(a) a new transmission line with a voltage of 500 kV or greater, or
(b) a modification of an existing transmission line that would result in a transmission line with a voltage of 500 kV or greater and requires more than 40 km of new right of way.

**4.2 Natural Gas Pipelines**
A reviewable project is a project for the construction of a new pipeline for the transmission of natural gas or natural gas liquids, if the pipeline would be more than 40 km in length and have a pipe diameter of 323.9 mm or greater.`,
    url: "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/243_2019",
  },
  "Project Description": {
    title: "Project Description Document",
    section: "Section 2.1 - Project Components",
    text: `The Northern Expansion Pipeline Project consists of the construction and operation of approximately 120 km of new 36-inch diameter natural gas transmission pipeline from the Dawson Creek processing facility to the Prince Rupert LNG export terminal.

Key project components include:
- 120 km of 36" (914.4 mm) steel pipeline
- 3 compressor stations at km 0, km 55, and km 115
- 2 major river crossings using horizontal directional drilling (HDD)
- Temporary access roads and laydown areas
- Valve sites and pig launcher/receiver stations`,
  },
  "Caribou Recovery Plan": {
    title: "Federal Recovery Strategy for Woodland Caribou",
    section: "Section 7 - Critical Habitat Protection",
    text: `Critical habitat for woodland caribou (boreal population) is identified based on a disturbance management threshold approach. The scientific evidence indicates that:

**Disturbance Thresholds:**
- Populations with ≤35% total disturbance in their range have a 60% probability of being self-sustaining
- Populations with 35-65% total disturbance require active management
- Populations with >65% disturbance are unlikely to be self-sustaining without intensive intervention

**Recommended Measures:**
1. Avoid new industrial disturbance in caribou ranges where total disturbance exceeds 35%
2. Implement timing restrictions during calving season (May 1 - July 15)
3. Maintain functional habitat connectivity corridors`,
    url: "https://wildlife-species.canada.ca/species-risk-registry/",
  },
  "NEB Decision 2018-042": {
    title: "National Energy Board Decision - Similar Pipeline Project",
    section: "Reasons for Decision",
    text: `**Project Overview:**
The ABC Pipeline Project proposed 95 km of natural gas transmission pipeline through similar boreal terrain.

**Key Findings:**
1. Environmental effects were determined to be significant but justifiable given proposed mitigation
2. Indigenous consultation was adequate following supplementary engagement
3. Caribou mitigation measures (18m ROW, seasonal restrictions) were accepted

**Conditions Imposed:**
- Condition 12: Develop Caribou Mitigation and Monitoring Plan
- Condition 15: Implement HDD crossings at all fish-bearing watercourses
- Condition 23: Establish Indigenous Guardian monitoring program

**Outcome:** Approved with 47 conditions`,
  },
};

export function SourcePreviewModal({
  open,
  onOpenChange,
  source,
}: SourcePreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!source) return null;

  // Look up the source excerpt or use the provided one
  const sourceData = SOURCE_EXCERPTS[source.reference] || {
    title: source.title || source.reference,
    section: source.section || "Source Excerpt",
    text: source.excerpt,
    url: source.url,
  };

  const getSourceIcon = () => {
    switch (source.type) {
      case "regulation":
        return <Scale className="h-4 w-4" />;
      case "library":
        return <BookOpen className="h-4 w-4" />;
      case "historical":
        return <History className="h-4 w-4" />;
      case "ai_generated":
        return <Sparkles className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getSourceTypeBadge = () => {
    const variants: Record<string, { label: string; className: string }> = {
      regulation: { label: "Regulation", className: "bg-primary/10 text-primary border-primary/30" },
      library: { label: "Library", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
      historical: { label: "Historical", className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
      ai_generated: { label: "AI Generated", className: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
      document: { label: "Document", className: "bg-secondary text-muted-foreground" },
    };
    const variant = variants[source.type] || variants.document;
    return (
      <Badge variant="outline" className={`text-[9px] ${variant.className}`}>
        {variant.label}
      </Badge>
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sourceData.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getSourceIcon()}
            <DialogTitle className="text-base">{sourceData.title}</DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-2">
            <span>{sourceData.section}</span>
            {getSourceTypeBadge()}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-auto">
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <div className="prose prose-sm max-w-none text-foreground">
              {sourceData.text.split("\n").map((line, i) => {
                // Handle markdown-style bold
                if (line.startsWith("**") && line.endsWith("**")) {
                  return (
                    <p key={i} className="font-semibold text-foreground mb-2">
                      {line.replace(/\*\*/g, "")}
                    </p>
                  );
                }
                if (line.includes("**")) {
                  const parts = line.split(/\*\*(.*?)\*\*/g);
                  return (
                    <p key={i} className="text-sm text-foreground/90 mb-2">
                      {parts.map((part, j) =>
                        j % 2 === 1 ? (
                          <strong key={j}>{part}</strong>
                        ) : (
                          <span key={j}>{part}</span>
                        )
                      )}
                    </p>
                  );
                }
                if (line.startsWith("- ")) {
                  return (
                    <li key={i} className="text-sm text-foreground/90 ml-4">
                      {line.substring(2)}
                    </li>
                  );
                }
                if (line.match(/^\d+\./)) {
                  return (
                    <li key={i} className="text-sm text-foreground/90 ml-4 list-decimal">
                      {line.replace(/^\d+\.\s*/, "")}
                    </li>
                  );
                }
                if (line.trim() === "") {
                  return <br key={i} />;
                }
                return (
                  <p key={i} className="text-sm text-foreground/90 mb-2">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-primary" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy text
              </>
            )}
          </Button>

          {sourceData.url && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              asChild
            >
              <a href={sourceData.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                View original
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
