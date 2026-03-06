"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Activity,
  TrendingUp,
  Layers,
} from "lucide-react";
import { ProjectStateBadge } from "@/components/shared/status-badge";
import { ProjectState } from "@/lib/types";

interface ProjectSummary {
  id: string;
  name: string;
  proponent: string;
  type: string;
  state: ProjectState;
  completeness: number;
  updatedAt: string;
}

const MOCK_PROJECTS: ProjectSummary[] = [
  {
    id: "proj_demo_pipeline",
    name: "Northern Expansion Pipeline Project",
    proponent: "Northern Energy Corp.",
    type: "Natural Gas Pipeline",
    state: ProjectState.DRAFT,
    completeness: 100,
    updatedAt: "2026-03-01",
  },
  {
    id: "proj_demo_transmission",
    name: "BC Hydro Northern Reinforcement Transmission Line",
    proponent: "BC Hydro",
    type: "Transmission Line",
    state: ProjectState.DRAFT,
    completeness: 100,
    updatedAt: "2026-03-05",
  },
  {
    id: "proj_002",
    name: "Caribou Creek Wind Farm",
    proponent: "GreenPower BC Inc.",
    type: "Wind Energy Facility",
    state: ProjectState.SCREENING_REQUIRED,
    completeness: 100,
    updatedAt: "2026-02-28",
  },
  {
    id: "proj_003",
    name: "Kootenay Copper Mine Expansion",
    proponent: "Pacific Minerals Ltd.",
    type: "Metal Mine",
    state: ProjectState.ANALYSIS_COMPLETE,
    completeness: 100,
    updatedAt: "2026-02-25",
  },
  {
    id: "proj_004",
    name: "Harrison Lake Run-of-River",
    proponent: "BC Hydro Solutions",
    type: "Hydroelectric Dam",
    state: ProjectState.EXEMPT,
    completeness: 100,
    updatedAt: "2026-02-20",
  },
  {
    id: "proj_005",
    name: "Kitimat LNG Phase 2",
    proponent: "LNG Canada Development",
    type: "LNG Terminal",
    state: ProjectState.UNDER_REVIEW,
    completeness: 100,
    updatedAt: "2026-02-15",
  },
];

const STATS = [
  {
    label: "Active Projects",
    value: "12",
    change: "+3 this month",
    icon: Layers,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Screening Required",
    value: "5",
    change: "2 pending review",
    icon: AlertTriangle,
    color: "text-wsp-orange",
    bg: "bg-wsp-orange/10",
  },
  {
    label: "Avg. Processing",
    value: "4.2d",
    change: "-18% vs last quarter",
    icon: TrendingUp,
    color: "text-wsp-blue",
    bg: "bg-wsp-blue/10",
  },
  {
    label: "Completed",
    value: "47",
    change: "8 this quarter",
    icon: CheckCircle2,
    color: "text-wsp-green",
    bg: "bg-wsp-green/10",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredProjects = MOCK_PROJECTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.proponent.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation — WSP dark nav bar */}
      <header className="sticky top-0 z-50 bg-[#1a1a1a]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/wsp-logo.png"
                alt="WSP"
                width={56}
                height={24}
                className="h-6"
                style={{ width: "auto" }}
                priority
              />
              <div>
                <span className="text-sm font-bold text-white leading-tight block">
                  Nature Vista
                </span>
                <span className="text-[10px] text-white/50 leading-tight block">
                  EIA Screening Platform
                </span>
              </div>
            </div>

          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="border-white/20 text-white/70 font-mono text-[10px]"
            >
              <Activity className="mr-1 h-3 w-3" />
              AGENT FRAMEWORK v1.0
            </Badge>
<Image
                  src="/images/wsp-circle.png"
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-full"
                  style={{ width: 28, height: 28 }}
                  />
          </div>
        </div>
        <div className="h-[3px] bg-primary" />
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <Card
              key={stat.label}
              className="border-border bg-card shadow-wsp"
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-[10px] ${stat.color}`}>{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project List Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Projects</h3>
            <p className="text-sm text-muted-foreground">
              Manage environmental impact assessment screenings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 bg-card pl-9 text-sm border-border"
              />
            </div>
            <Button
              size="sm"
              onClick={() => router.push("/project/proj_demo_pipeline/setup")}
              className="bg-primary text-primary-foreground hover:bg-[#c8140d]"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Assessment
            </Button>
          </div>
        </div>

        {/* Project Cards */}
        <div className="space-y-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="group cursor-pointer border-border bg-card shadow-wsp transition-shadow hover:shadow-wsp-hover"
              onClick={() => router.push(`/project/${project.id}/setup`)}
            >
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wsp-red-light">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {project.proponent}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">
                        {project.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Completeness */}
                  <div className="hidden items-center gap-2 sm:flex">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${project.completeness}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {project.completeness}%
                    </span>
                  </div>

                  <ProjectStateBadge state={project.state} />

                  <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                    <Clock className="h-3 w-3" />
                    {project.updatedAt}
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/wsp-logo.png"
              alt="WSP"
              width={48}
              height={20}
              className="h-5 opacity-60"
              style={{ width: "auto" }}
            />
            <span className="text-[10px] text-muted-foreground">
              Nature Vista EIA Screening Platform
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            Powered by Microsoft Agent Framework
          </span>
        </div>
      </footer>
    </div>
  );
}
