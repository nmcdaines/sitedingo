"use client";

import { cn } from "@/lib/utils";
import {
  Home,
  FileText,
  Users,
  Briefcase,
  Mail,
  Settings,
  MoreHorizontal,
  Image,
  Star,
} from "lucide-react";
import { SortableSectionCard } from "./sortable-section-card";
import type { ProjectPage, PageIcon } from "./types";

const iconMap: Record<PageIcon, React.ComponentType<{ className?: string }>> = {
  home: Home,
  file: FileText,
  users: Users,
  briefcase: Briefcase,
  mail: Mail,
  settings: Settings,
  image: Image,
  star: Star,
};

interface PageCardProps {
  page: ProjectPage;
  isSelected?: boolean;
  onClick?: () => void;
  onSectionClick?: (sectionId: string) => void;
  selectedSectionId?: string;
  compact?: boolean;
}

export function PageCard({
  page,
  isSelected,
  onClick,
  onSectionClick,
  selectedSectionId,
  compact = false,
}: PageCardProps) {
  const Icon = page.icon ? iconMap[page.icon] : FileText;

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl shadow-sm overflow-hidden",
        "transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary",
        compact ? "w-[220px]" : "w-[260px]"
      )}
    >
      {/* Page Header */}
      <div
        onClick={onClick}
        className={cn(
          "flex items-center justify-between px-3 py-2.5 bg-muted/50 border-b border-border cursor-pointer",
          "hover:bg-muted transition-colors"
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className={cn("font-medium", compact ? "text-sm" : "text-sm")}>{page.name}</span>
        </div>
        <button
          className="p-1 rounded hover:bg-background transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // Menu action would go here
          }}
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Sections */}
      <div 
        className={cn(
          "p-2 space-y-1.5 overflow-y-auto",
          compact ? "max-h-[220px]" : "max-h-[380px]"
        )}
      >
        {page.sections.map((section) => (
          <SortableSectionCard
            key={section.id}
            section={section}
            isSelected={selectedSectionId === section.id}
            onClick={() => onSectionClick?.(section.id)}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
