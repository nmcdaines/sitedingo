"use client";

import { cn } from "@/lib/utils";
import type { ProjectSection } from "./types";

interface SectionCardProps {
  section: ProjectSection;
  isSelected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function SectionCard({ section, isSelected, onClick, compact = false }: SectionCardProps) {
  const hasDescription = !!section.description;

  return (
    <div
      onClick={onClick}
      className={cn(
        "border border-border bg-white rounded-lg cursor-pointer transition-all",
        "hover:border-primary/50 hover:shadow-sm",
        isSelected && "border-primary ring-2 ring-primary/20",
        hasDescription ? (compact ? "p-2" : "p-2.5") : "p-2"
      )}
    >
      <div className={cn(
        "font-medium text-foreground",
        compact ? "text-xs" : "text-sm"
      )}>
        {section.name}
      </div>
      {section.description && (
        <p className={cn(
          "text-muted-foreground mt-1",
          compact ? "text-[10px] line-clamp-2" : "text-xs line-clamp-2"
        )}>
          {section.description}
        </p>
      )}
    </div>
  );
}
