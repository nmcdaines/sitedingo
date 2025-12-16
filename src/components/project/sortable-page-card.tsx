"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  GripVertical,
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

interface SortablePageCardProps {
  page: ProjectPage;
  isSelected?: boolean;
  onClick?: () => void;
  onSectionClick?: (sectionId: string) => void;
  selectedSectionId?: string;
  compact?: boolean;
  isDraggable?: boolean;
  isOverlay?: boolean;
}

export function SortablePageCard({
  page,
  isSelected,
  onClick,
  onSectionClick,
  selectedSectionId,
  compact = false,
  isDraggable = true,
  isOverlay = false,
}: SortablePageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: page.id,
    disabled: !isDraggable || isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const Icon = page.icon ? iconMap[page.icon] : FileText;

  return (
    <div
      ref={setNodeRef}
      style={isOverlay ? undefined : style}
      className={cn(
        "bg-card border border-border rounded-xl shadow-sm overflow-hidden",
        "hover:shadow-md",
        isSelected && "ring-2 ring-primary",
        isDragging && "border-dashed border-primary/50 bg-primary/5",
        isOverlay && "shadow-xl border-primary",
        compact ? "w-[220px]" : "w-[260px]"
      )}
    >
      {/* Page Header - entire header is draggable */}
      <div
        className={cn(
          "flex items-center justify-between px-2 py-2.5 bg-muted/50 border-b border-border",
          "hover:bg-muted transition-colors",
          isDraggable && "cursor-grab active:cursor-grabbing",
          !isDraggable && "cursor-pointer"
        )}
        onClick={!isDragging ? onClick : undefined}
        {...(isDraggable ? { ...attributes, ...listeners } : {})}
      >
        <div className="flex items-center gap-1.5">
          {/* Drag Handle Icon - visible when draggable */}
          {isDraggable && (
            <GripVertical className="w-4 h-4 text-muted-foreground/50" />
          )}
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className={cn("font-medium", compact ? "text-sm" : "text-sm")}>
            {page.name}
          </span>
        </div>
        <button
          className="p-1 rounded hover:bg-background transition-colors"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Sections - rendered directly, sortable context is handled by parent */}
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
