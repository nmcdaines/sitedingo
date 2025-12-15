"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  name: string;
  description?: string;
  componentType: string;
}

interface PageCardProps {
  id: string;
  name: string;
  sections?: Section[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

export function PageCard({
  id,
  name,
  sections = [],
  isExpanded = false,
  onToggleExpand,
  className,
}: PageCardProps) {
  return (
    <div
      className={cn(
        "relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleExpand}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <span className="font-semibold text-gray-900 text-sm">{name}</span>
        </div>
        <button
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="More options"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Sections */}
      {isExpanded && sections.length > 0 && (
        <div className="p-3 space-y-2">
          {sections.map((section) => (
            <div
              key={section.id}
              className="p-3 bg-gray-50 border border-gray-200 rounded text-xs hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="font-medium text-gray-900 mb-1">
                {section.name}
              </div>
              {section.description && (
                <div className="text-gray-600 leading-relaxed line-clamp-3">
                  {section.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Collapsed state hint */}
      {!isExpanded && sections.length > 0 && (
        <div className="px-4 py-2 text-xs text-gray-500">
          {sections.length} section{sections.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
