"use client";

import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Users,
  MessageSquare,
  Share2,
  Download,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ViewMode, ProjectData } from "./types";

interface ProjectHeaderProps {
  project: ProjectData;
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const viewTabs: { id: ViewMode; label: string }[] = [
  { id: "sitemap", label: "Sitemap" },
  { id: "wireframe", label: "Wireframe" },
  { id: "style-guide", label: "Style Guide" },
  { id: "design", label: "Design" },
];

export function ProjectHeader({
  project,
  activeView,
  onViewChange,
}: ProjectHeaderProps) {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>

        {/* Project Name Dropdown */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
          <span className="font-medium text-sm">{project.name}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Invite Button */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="text-sm">Invite & earn</span>
        </button>
      </div>

      {/* Center - View Tabs */}
      <div className="flex items-center">
        <div className="flex bg-muted rounded-lg p-1">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                activeView === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Collaborators */}
        <div className="flex -space-x-2 mr-2">
          {project.collaborators?.slice(0, 4).map((collaborator, index) => (
            <div
              key={collaborator.id}
              className={cn(
                "w-8 h-8 rounded-full border-2 border-card flex items-center justify-center text-xs font-medium",
                index % 2 === 0
                  ? "bg-emerald-500 text-white"
                  : "bg-amber-500 text-white"
              )}
              title={collaborator.name}
            >
              {collaborator.name.slice(0, 2)}
            </div>
          ))}
        </div>

        {/* Actions */}
        <Button variant="ghost" size="icon-sm">
          <MessageSquare className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="sm">
          <Share2 className="w-4 h-4" />
          Share
        </Button>

        <Button variant="outline" size="sm">
          <Download className="w-4 h-4" />
          Export
        </Button>

        <Button size="sm">Upgrade</Button>
      </div>
    </header>
  );
}
