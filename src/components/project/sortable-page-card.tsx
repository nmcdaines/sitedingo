"use client";

import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
import type { ProjectPage, PageIcon, ProjectSection } from "./types";

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
  onSectionsReorder?: (pageId: string, sections: ProjectSection[]) => void;
  selectedSectionId?: string;
  compact?: boolean;
  isDraggable?: boolean;
}

export function SortablePageCard({
  page,
  isSelected,
  onClick,
  onSectionClick,
  selectedSectionId,
  compact = false,
  isDraggable = true,
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
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = page.icon ? iconMap[page.icon] : FileText;
  const sectionIds = page.sections.map((s) => s.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border border-border rounded-xl shadow-sm overflow-hidden",
        "transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary",
        isDragging && "opacity-50 shadow-xl z-50",
        compact ? "w-[220px]" : "w-[260px]"
      )}
    >
      {/* Page Header */}
      <div
        onClick={onClick}
        className={cn(
          "flex items-center justify-between px-2 py-2.5 bg-muted/50 border-b border-border cursor-pointer group",
          "hover:bg-muted transition-colors"
        )}
      >
        <div className="flex items-center gap-1">
          {/* Drag Handle */}
          {isDraggable && (
            <button
              className={cn(
                "p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing",
                "hover:bg-background text-muted-foreground"
              )}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4" />
            </button>
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

      {/* Sections with sortable context */}
      <div
        className={cn(
          "p-2 space-y-1.5 overflow-y-auto",
          compact ? "max-h-[220px]" : "max-h-[380px]"
        )}
      >
        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
          {page.sections.map((section) => (
            <SortableSectionCard
              key={section.id}
              section={section}
              isSelected={selectedSectionId === section.id}
              onClick={() => onSectionClick?.(section.id)}
              compact={compact}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
