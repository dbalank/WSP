"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

export const DynamicProjectMap = dynamic(
  () => import("@/components/map/project-map").then((mod) => mod.ProjectMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-border bg-secondary/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading map...</span>
        </div>
      </div>
    ),
  }
);
