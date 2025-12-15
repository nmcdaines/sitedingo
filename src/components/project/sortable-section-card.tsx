"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import type { ProjectSection } from "./types";

interface SortableSectionCardProps {
  section: ProjectSection;
  isSelected?: boolean;
  onClick?: () => void;
  compact?: boolean;
  isOverlay?: boolean;
}

export function SortableSectionCard({
  section,
  isSelected,
  onClick,
  compact = false,
  isOverlay = false,
}: SortableSectionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled: isOverlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const hasDescription = !!section.description;

  return (
    <div
      ref={setNodeRef}
      style={isOverlay ? undefined : style}
      onClick={onClick}
      className={cn(
        "border border-border bg-white rounded-lg cursor-pointer transition-colors group",
        "hover:border-primary/50 hover:shadow-sm",
        isSelected && "border-primary ring-2 ring-primary/20",
        isDragging && "border-dashed border-primary/50 bg-primary/5",
        isOverlay && "shadow-lg border-primary cursor-grabbing",
        hasDescription ? (compact ? "p-2" : "p-2.5") : "p-2"
      )}
    >
      <div className="flex items-start gap-1.5">
        {/* Drag Handle */}
        <button
          className={cn(
            "flex-shrink-0 p-0.5 -ml-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing",
            "hover:bg-muted text-muted-foreground"
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "font-medium text-foreground",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {section.name}
          </div>
          {section.description && (
            <p
              className={cn(
                "text-muted-foreground mt-1",
                compact ? "text-[10px] line-clamp-2" : "text-xs line-clamp-2"
              )}
            >
              {section.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
