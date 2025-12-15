"use client";

import { cn } from "@/lib/utils";
import { X, Edit2, Trash2, Copy, MoveUp, MoveDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectSection } from "./types";

interface SectionDetailPanelProps {
  section: ProjectSection;
  pageName: string;
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

export function SectionDetailPanel({
  section,
  pageName,
  isOpen,
  onClose,
  position,
}: SectionDetailPanelProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute z-50 w-72 bg-card border border-border rounded-xl shadow-lg overflow-hidden",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      style={
        position
          ? { left: position.x, top: position.y }
          : { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-white text-xs font-medium">
            ND
          </div>
          <span className="text-xs text-muted-foreground">{pageName}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-sm mb-1">{section.name}</h3>
        {section.description && (
          <p className="text-xs text-muted-foreground">{section.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 p-2 border-t border-border bg-muted/20">
        <Button variant="ghost" size="icon-sm" title="Edit">
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" title="Duplicate">
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" title="Move Up">
          <MoveUp className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" title="Move Down">
          <MoveDown className="w-3.5 h-3.5" />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
