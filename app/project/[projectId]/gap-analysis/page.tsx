"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

// Redirect old gap-analysis URL to new project-analysis page
export default function GapAnalysisRedirect() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  useEffect(() => {
    router.replace(`/project/${projectId}/project-analysis`);
  }, [router, projectId]);

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <p className="text-sm text-muted-foreground">Redirecting...</p>
    </div>
  );
}
