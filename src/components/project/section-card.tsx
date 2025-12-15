"use client";

import { cn } from "@/lib/utils";
import type { ProjectSection } from "./types";

interface SectionCardProps {
  section: ProjectSection;
  isSelected?: boolean;
  onClick?: () => void;
}

export function SectionCard({ section, isSelected, onClick }: SectionCardProps) {
  const hasDescription = !!section.description;

  return (
    <div
      onClick={onClick}
      className={cn(
        "border border-border bg-white rounded-lg cursor-pointer transition-all",
        "hover:border-primary/50 hover:shadow-sm",
        isSelected && "border-primary ring-2 ring-primary/20",
        hasDescription ? "p-3" : "p-2"
      )}
    >
      <div className="font-medium text-sm text-foreground">{section.name}</div>
      {section.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
          {section.description}
        </p>
      )}
    </div>
  );
}
